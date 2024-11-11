import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { MdDelete } from 'react-icons/md';
import { FaRegEdit } from 'react-icons/fa';
import './App.css';

function FaqEditor({ token }) {
    const [faqs, setFaqs] = useState([]);
    const [modalQuestion, setModalQuestion] = useState('');
    const [modalAnswer, setModalAnswer] = useState('');
    const [editId, setEditId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    useEffect(() => {
        fetchFAQs(token);
    }, [token]);

    const fetchFAQs = async () => {
        try {
            const { data: faqs, error } = await supabase.from('faqs').select('*');
            if (error) {
                throw new Error(error.message);
            }
            setFaqs(faqs);
        } catch (err) {
            console.error('Failed to fetch FAQs:', err.message);
        }
    };

    const handleAddFAQ = async () => {
        try {
            if (editId) {
                await supabase
                    .from('faqs')
                    .update({ question: modalQuestion, answer: modalAnswer })
                    .eq('id', editId);
                setEditId(null);
            } else {
                await supabase.from('faqs').insert([{ question: modalQuestion, answer: modalAnswer }]);
            }
            fetchFAQs(token);
            setModalQuestion('');
            setModalAnswer('');
            setShowModal(false);
        } catch (err) {
            console.error('Failed to add FAQ:', err.message);
        }
    };

    const handleDeleteFAQ = async () => {
        try {
            await supabase.from('faqs').delete().eq('id', deleteId);
            fetchFAQs(token);
            setShowDeleteModal(false);
        } catch (err) {
            console.error('Failed to delete FAQ:', err.message);
        }
    };

    const handleEditFAQ = (faq) => {
        setEditId(faq.id);
        setModalQuestion(faq.question);
        setModalAnswer(faq.answer);
        setShowModal(true);
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (!error) {
            localStorage.removeItem('token');
            window.location.reload();
        } else {
            console.error('Error signing out:', error.message);
        }
    };

    const confirmDelete = (id) => {
        setDeleteId(id);
        setShowDeleteModal(true);
    };

    const handleCancel = () => {
        setModalQuestion('');
        setModalAnswer('');
        setEditId(null);
        setShowModal(false);
    };

    return (
        <div className="faq-management ">
            <div className="header max-w-5xl mx-auto flex flex-col justify-center items-center text-center ">
                <h1 className="text-4xl font-bold text-white">FAQ Management</h1>
                <p className="text-black pt-2">An intuitive and easy to use interface for changing FAQ's for the UTS Social Impact Grant.</p>
                <button onClick={handleLogout} className="logout-button">Logout</button>
            </div>

            <div className="faq-header max-w-5xl mx-auto flex justify-between items-center text-center">
                <h3 className="text-2xl font-semibold border-2 bg-white pr-4 pl-4 pt-2 pb-2 rounded-md">Existing FAQs</h3>
                <button onClick={() => setShowModal(true)} className="add-faq-button">Add FAQ</button>
            </div>

            <div className="faq-container max-w-5xl mx-auto flex flex-col justify-center items-center text-center">
                <ul className="faq-list">
                    {faqs.map((faq) => (
                        <li key={faq.id} className="faq-item">
                            <div>
                                <strong className="text-lg">{faq.question}:</strong> <span className="text-gray-700">{faq.answer}</span>
                            </div>
                            <div className="faq-actions">
                                <FaRegEdit
                                    onClick={() => handleEditFAQ(faq)}
                                    className="text-blue-500"
                                />
                                <MdDelete
                                    onClick={() => confirmDelete(faq.id)}
                                    style={{ color: 'red' }}
                                />
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3 className="text-xl font-semibold">{editId ? 'Edit FAQ' : 'Add FAQ'}</h3>
                        <div className="mt-4">
                            <label className="block text-sm">Question</label>
                            <input
                                className="border p-2 rounded w-full"
                                type="text"
                                value={modalQuestion}
                                onChange={(e) => setModalQuestion(e.target.value)}
                            />
                        </div>
                        <div className="mt-4">
                            <label className="block text-sm">Answer</label>
                            <textarea
                                className="border p-2 rounded w-full"
                                value={modalAnswer}
                                onChange={(e) => setModalAnswer(e.target.value)}
                                rows="4"
                            />
                        </div>
                        <div className="modal-actions">
                            <button onClick={handleCancel} className="cancel-button">Cancel</button>
                            <button
                                onClick={handleAddFAQ}
                                className="save-button"
                            >
                                {editId ? 'Save' : 'Add FAQ'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && (
                <div className="modal">
                    <div className="modal-content">
                        <h3 className="text-xl font-semibold">Delete FAQ</h3>
                        <p className="text-gray-700 mb-4">Are you sure you want to delete this FAQ?</p>
                        <div className="modal-actions">
                            <button onClick={() => setShowDeleteModal(false)} className="cancel-button">Cancel</button>
                            <button onClick={handleDeleteFAQ} className="delete-button">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default FaqEditor;