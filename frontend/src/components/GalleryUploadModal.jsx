import React, { useState, useRef } from 'react';
import { X, Upload, Image } from 'lucide-react';

const BASE = `${import.meta.env.VITE_API_URL}/api`;

export default function GalleryUploadModal({ token, onClose, onUploaded }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        if (f.size > 8 * 1024 * 1024) { setError('Image must be under 8 MB'); return; }
        setFile(f);
        setPreview(URL.createObjectURL(f));
        setError('');
    };

    const submit = async () => {
        if (!file) { setError('Please select an image'); return; }
        setLoading(true);
        setError('');
        try {
            const fd = new FormData();
            fd.append('image', file);
            if (title) fd.append('title', title);
            if (description) fd.append('description', description);

            const res = await fetch(`${BASE}/gallery/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Upload failed');
            onUploaded(data.image);
            onClose();
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 600,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
            }}
            onClick={onClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#1a1035', border: '1px solid var(--border)',
                    borderRadius: 20, padding: '28px 28px 24px', width: '100%', maxWidth: 480,
                    boxShadow: '0 24px 80px rgba(0,0,0,0.7)', animation: 'fadeInUp 0.25s ease',
                }}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.2rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Image size={18} strokeWidth={1.8} style={{ color: 'var(--primary-light)' }} /> Add to Gallery
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: 8, padding: 6 }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Image picker */}
                <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                        border: '2px dashed var(--border)', borderRadius: 14, cursor: 'pointer',
                        overflow: 'hidden', height: 200, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', marginBottom: 18, position: 'relative',
                        transition: 'border-color 0.2s',
                        background: 'rgba(255,255,255,0.03)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary-light)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                    {preview ? (
                        <img src={preview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                            <Image size={36} strokeWidth={1} style={{ marginBottom: 10 }} />
                            <p style={{ fontSize: '0.875rem', margin: 0 }}>Click to select a photo</p>
                            <small style={{ fontSize: '0.75rem' }}>JPG, PNG, WEBP · max 8 MB</small>
                        </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                            Caption / Title <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="e.g. Annual Day 2024"
                            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 6 }}>
                            Description <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(optional)</span>
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="A short description…"
                            rows={2}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', color: 'var(--text)', fontSize: '0.875rem', outline: 'none', fontFamily: 'Inter', resize: 'vertical', boxSizing: 'border-box' }}
                        />
                    </div>

                    {error && <p style={{ color: '#fca5a5', fontSize: '0.82rem', margin: 0 }}>⚠️ {error}</p>}

                    <button
                        onClick={submit}
                        disabled={loading || !file}
                        style={{
                            width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg,var(--primary),var(--primary-light))',
                            color: '#fff', fontFamily: 'Outfit', fontWeight: 700, fontSize: '0.95rem',
                            cursor: loading || !file ? 'not-allowed' : 'pointer',
                            opacity: loading || !file ? 0.65 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <Upload size={16} strokeWidth={2} />
                        {loading ? 'Uploading…' : 'Upload to Gallery'}
                    </button>
                </div>
            </div>
        </div>
    );
}
