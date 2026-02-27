import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '../../lib/api';
import { MessageSquare, Send, Search, Users } from 'lucide-react';

const BASE_URL = `${import.meta.env.VITE_API_URL}/uploads/`;

function Avatar({ user, size = 38 }) {
    if (user?.profilePicture) {
        return (
            <img
                src={BASE_URL + user.profilePicture}
                alt={user.name}
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
            />
        );
    }
    const initials = user?.name?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    return (
        <div style={{
            width: size, height: size, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(108,62,184,0.5),rgba(6,182,212,0.3))',
            fontSize: size * 0.36, fontWeight: 700, color: '#c4b5fd',
        }}>
            {initials}
        </div>
    );
}

export default function InboxSection({ token, currentUser }) {
    const [students, setStudents] = useState([]);          // all students
    const [convMap, setConvMap] = useState({});            // { studentId: { unreadCount, lastMessage } }
    const [selected, setSelected] = useState(null);        // selected student object
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState('');
    const [listTab, setListTab] = useState('all');         // 'all' | 'messages'
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);
    const pollRef = useRef(null);

    // Load all students + inbox conversation data
    const loadData = useCallback(async () => {
        try {
            const [studentsRes, inboxRes] = await Promise.all([
                apiFetch('/teacher/students', {}, token),
                apiFetch('/messages/inbox', {}, token),
            ]);

            setStudents(studentsRes.students || []);

            // Build convMap from inbox
            const map = {};
            for (const conv of (inboxRes.conversations || [])) {
                map[conv.contact._id] = {
                    unreadCount: conv.unreadCount,
                    lastMessage: conv.lastMessage,
                };
            }
            setConvMap(map);
        } catch (_) { }
    }, [token]);

    useEffect(() => {
        loadData();
        const i = setInterval(loadData, 10000);
        return () => clearInterval(i);
    }, [loadData]);

    // Load conversation with selected student
    const loadConversation = useCallback(async (studentId) => {
        if (!studentId) return;
        setLoading(true);
        try {
            const d = await apiFetch(`/messages/conversation/${studentId}`, {}, token);
            setMessages(d.messages || []);
        } catch (_) { }
        setLoading(false);
    }, [token]);

    const selectStudent = (student) => {
        setSelected(student);
        setMessages([]);
        loadConversation(student._id);
        // Mark read
        if (convMap[student._id]?.unreadCount > 0) {
            apiFetch(`/messages/read/${student._id}`, { method: 'PATCH' }, token).catch(() => { });
        }
        loadData();
    };

    // Poll for new messages when a conversation is open
    useEffect(() => {
        if (!selected) return;
        clearInterval(pollRef.current);
        pollRef.current = setInterval(() => loadConversation(selected._id), 8000);
        return () => clearInterval(pollRef.current);
    }, [selected, loadConversation]);

    // Scroll to bottom when messages change
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!text.trim() || !selected || sending) return;
        setSending(true);
        try {
            await apiFetch('/messages/send', {
                method: 'POST',
                body: JSON.stringify({ receiverId: selected._id, content: text.trim() }),
            }, token);
            setText('');
            await loadConversation(selected._id);
            await loadData();
        } catch (_) { }
        setSending(false);
    };

    // Filter & sort students
    const filtered = students.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollmentNumber?.toLowerCase().includes(search.toLowerCase())
    ).filter(s => listTab === 'messages' ? !!convMap[s._id] : true)
        .sort((a, b) => {
            // Put students with messages first
            const aHas = !!convMap[a._id];
            const bHas = !!convMap[b._id];
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;
            return 0;
        });

    const totalUnread = Object.values(convMap).reduce((sum, c) => sum + (c.unreadCount || 0), 0);

    return (
        <div className="td-section-wrap">
            <div className="inbox-layout">
                {/* ── LEFT: student list ── */}
                <aside className="inbox-sidebar">
                    <div className="inbox-sidebar-header">
                        <h3 style={{ fontFamily: 'Outfit', fontSize: '1rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MessageSquare size={16} /> Messages
                            {totalUnread > 0 && <span className="inbox-unread-badge">{totalUnread}</span>}
                        </h3>

                        {/* Tab switch */}
                        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 3 }}>
                            <button
                                onClick={() => setListTab('all')}
                                style={{
                                    flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Outfit',
                                    background: listTab === 'all' ? 'var(--primary)' : 'transparent',
                                    color: listTab === 'all' ? '#fff' : 'var(--text-muted)'
                                }}
                            >
                                <Users size={11} style={{ marginRight: 4 }} />All Students
                            </button>
                            <button
                                onClick={() => setListTab('messages')}
                                style={{
                                    flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'Outfit',
                                    background: listTab === 'messages' ? 'var(--primary)' : 'transparent',
                                    color: listTab === 'messages' ? '#fff' : 'var(--text-muted)'
                                }}
                            >
                                <MessageSquare size={11} style={{ marginRight: 4 }} />Chats
                            </button>
                        </div>

                        <div className="inbox-search">
                            <Search size={13} />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="Search by name or enrollment…"
                            />
                        </div>
                    </div>

                    <div className="inbox-conv-list">
                        {filtered.length === 0 ? (
                            <div className="inbox-empty-list">
                                <Users size={32} strokeWidth={1} />
                                <p>{listTab === 'messages' ? 'No student chats yet' : 'No students found'}</p>
                                <small>{listTab === 'messages' ? 'Switch to "All Students" to initiate a conversation' : 'Students will appear here once registered'}</small>
                            </div>
                        ) : filtered.map(student => {
                            const conv = convMap[student._id];
                            return (
                                <button
                                    key={student._id}
                                    className={`inbox-conv-item ${selected?._id === student._id ? 'active' : ''}`}
                                    onClick={() => selectStudent(student)}
                                >
                                    <Avatar user={student} size={40} />
                                    <div className="inbox-conv-meta">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <strong style={{ fontSize: '0.85rem' }}>{student.name}</strong>
                                            {conv?.unreadCount > 0 && (
                                                <span className="inbox-unread-badge">{conv.unreadCount}</span>
                                            )}
                                        </div>
                                        <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem', display: 'block', marginTop: 1 }}>
                                            {student.enrollmentNumber || student.course || 'Student'}
                                        </small>
                                        {conv?.lastMessage && (
                                            <small style={{ color: 'var(--text-muted)', fontSize: '0.7rem', display: 'block', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', maxWidth: 160 }}>
                                                {conv.lastMessage.content}
                                            </small>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </aside>

                {/* ── RIGHT: chat area ── */}
                <div className="inbox-chat">
                    {!selected ? (
                        <div className="inbox-chat-empty">
                            <MessageSquare size={52} strokeWidth={1} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
                            <h3>Select a student</h3>
                            <p>Choose any student from the left to view or start a conversation</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="inbox-chat-header">
                                <Avatar user={selected} size={38} />
                                <div>
                                    <strong style={{ fontSize: '0.95rem' }}>{selected.name}</strong>
                                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                        {selected.enrollmentNumber || ''}{selected.course ? ` · ${selected.course}` : ''}{selected.group ? ` · ${selected.group}` : ''}
                                    </small>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="inbox-messages">
                                {loading ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                                        <div className="spinner" style={{ width: 24, height: 24 }} />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="inbox-no-messages">
                                        <MessageSquare size={28} strokeWidth={1} />
                                        <p>No messages yet. Say hello!</p>
                                    </div>
                                ) : messages.map(msg => {
                                    const isMe = msg.senderId._id === currentUser?.id || msg.senderId._id === currentUser?._id;
                                    return (
                                        <div key={msg._id} className={`inbox-bubble-wrap ${isMe ? 'me' : 'them'}`}>
                                            {!isMe && <Avatar user={msg.senderId} size={28} />}
                                            <div className={`inbox-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                                                <p>{msg.content}</p>
                                                <span className="bubble-time">
                                                    {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>

                            {/* Input */}
                            <div className="inbox-input-wrap">
                                <input
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                    placeholder={`Message ${selected.name}…`}
                                    className="inbox-input"
                                />
                                <button
                                    className="inbox-send-btn"
                                    onClick={sendMessage}
                                    disabled={!text.trim() || sending}
                                >
                                    <Send size={16} strokeWidth={2} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
