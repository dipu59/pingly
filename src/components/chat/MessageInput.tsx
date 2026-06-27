'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Image, Mic, Smile, Plus, X, Edit2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sendMessage, setTypingStatus, editMessage } from '@/services/chatService';
import { uploadImage, uploadVoice } from '@/services/cloudinary';
import { cn } from '@/lib/utils';
import EmojiPicker from './EmojiPicker';
import type { Message } from '@/types/chat';

interface MessageInputProps {
  chatId: string;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  editingMessage?: Message | null;
  onCancelEdit?: () => void;
}

export default function MessageInput({ 
  chatId, 
  replyingTo, 
  onCancelReply,
  editingMessage,
  onCancelEdit
}: MessageInputProps) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (editingMessage && editingMessage.type === 'text') {
      setText(editingMessage.text ?? '');
    } else if (!editingMessage) {
      setText('');
    }
  }, [editingMessage]);

  const handleTyping = useCallback(() => {
    if (!user) return;
    setTypingStatus(chatId, user.uid, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(chatId, user.uid, false);
    }, 2500);
  }, [chatId, user]);

  const handleSendText = async () => {
    if (!text.trim() || !user || sending) return;
    const payload = text.trim();
    setText('');
    setSending(true);
    // Stop typing indicator immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setTypingStatus(chatId, user.uid, false);
    
    const replyData = replyingTo ? {
      id: replyingTo.id,
      text: replyingTo.type === 'text' ? (replyingTo.text ?? '') : (replyingTo.type === 'image' ? '📷 Photo' : '🎤 Voice note'),
      senderId: replyingTo.senderId,
    } : undefined;

    try {
      if (editingMessage) {
        await editMessage(chatId, editingMessage.id, payload);
        if (onCancelEdit) onCancelEdit();
      } else {
        await sendMessage(chatId, user.uid, { text: payload, type: 'text', replyTo: replyData });
        if (onCancelReply) onCancelReply();
      }
    } catch (err) {
      console.error('Send failed:', err);
      setText(payload); // Restore on failure
    } finally {
      setSending(false);
      // Ensure the input remains focused after sending
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendText();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 20 * 1024 * 1024) {
      alert('Image must be under 20MB');
      return;
    }

    setSending(true);
    setUploadProgress(0);
    try {
      const url = await uploadImage(file, (p) => setUploadProgress(p));
      
      const replyData = replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.type === 'text' ? (replyingTo.text ?? '') : (replyingTo.type === 'image' ? '📷 Photo' : '🎤 Voice note'),
        senderId: replyingTo.senderId,
      } : undefined;

      await sendMessage(chatId, user.uid, {
        imageUrl: url,
        type: 'image',
        replyTo: replyData,
      });
      if (onCancelReply) onCancelReply();
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      setSending(false);
      setUploadProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstart = () => {
        setIsRecording(true);
        setRecordingDuration(0);
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration((prev) => prev + 1);
        }, 1000);
      };

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0 || !user) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Upload audio
        setSending(true);
        setUploadProgress(0);
        try {
          const url = await uploadVoice(audioBlob, (p) => setUploadProgress(p));
          
          const replyData = replyingTo ? {
            id: replyingTo.id,
            text: replyingTo.type === 'text' ? (replyingTo.text ?? '') : (replyingTo.type === 'image' ? '📷 Photo' : '🎤 Voice note'),
            senderId: replyingTo.senderId,
          } : undefined;

          await sendMessage(chatId, user.uid, {
            audioUrl: url,
            duration: recordingDuration,
            type: 'voice',
            replyTo: replyData,
          });
          if (onCancelReply) onCancelReply();
        } catch (err) {
          console.error('Voice upload failed:', err);
        } finally {
          setSending(false);
          setUploadProgress(null);
        }
      };

      mediaRecorder.start();
    } catch (err) {
      console.error('Failed to access microphone:', err);
      alert('Microphone access is required to send voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      audioChunksRef.current = []; // Clear chunks so it doesn't upload
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canSend = text.trim().length > 0 && !isRecording;

  return (
    <div
      className="flex-shrink-0 border-t px-4 py-3 relative"
      style={{
        borderColor: 'var(--color-border)',
        background: 'rgba(9,9,11,0.95)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Upload progress bar */}
      {uploadProgress !== null && (
        <div className="absolute top-0 left-0 h-1 w-full overflow-hidden" style={{ background: 'var(--color-surface-2)' }}>
          <motion.div
            className="h-full gradient-violet"
            initial={{ width: 0 }}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
      )}

      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="flex items-center justify-between rounded-xl px-4 py-2 border-l-4 overflow-hidden"
            style={{
              background: 'rgba(39,39,42,0.6)',
              borderLeftColor: 'var(--color-violet)',
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-violet-400">
                Replying to message
              </p>
              <p className="truncate text-sm text-zinc-300">
                {replyingTo.type === 'text' ? replyingTo.text : (replyingTo.type === 'image' ? '📷 Photo' : '🎤 Voice note')}
              </p>
            </div>
            <button
              onClick={onCancelReply}
              className="ml-2 rounded-full p-1 transition-colors hover:bg-zinc-700/50"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Preview */}
      <AnimatePresence>
        {editingMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="flex items-center justify-between rounded-xl px-4 py-2 border-l-4 overflow-hidden"
            style={{
              background: 'rgba(39,39,42,0.6)',
              borderLeftColor: 'var(--color-primary)',
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold" style={{ color: 'var(--color-primary)' }}>
                Editing message
              </p>
              <p className="truncate text-sm text-zinc-300">
                {editingMessage.text}
              </p>
            </div>
            <button
              onClick={onCancelEdit}
              className="ml-2 rounded-full p-1 transition-colors hover:bg-zinc-700/50"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2">
        {/* Attachment button */}
        {!isRecording && (
          <button
            id="attach-btn"
            aria-label="Attach file"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 hover:bg-zinc-800/60"
            style={{ color: 'var(--color-text-muted)' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <Plus className="h-5 w-5" />
          </button>
        )}

        {/* Image upload (hidden) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />

        {/* Text input / Recording UI */}
        <div className="relative flex-1 flex items-center">
          {isRecording ? (
            <div className="flex w-full items-center justify-between px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="h-2.5 w-2.5 rounded-full bg-red-500"
                />
                <span className="text-sm font-medium text-red-400">
                  {formatDuration(recordingDuration)}
                </span>
              </div>
              <button
                onClick={cancelRecording}
                className="text-xs font-medium text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              {/* Textarea + emoji button wrapper */}
              <div className="relative flex-1">
                <textarea
                  id="message-input"
                  ref={textareaRef}
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    handleTyping();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Type a message…"
                  rows={1}
                  className={cn(
                    'w-full resize-none rounded-xl px-4 py-2.5 pr-10 text-sm outline-none transition-all duration-200',
                    'scrollbar-none max-h-32 overflow-y-auto',
                    'placeholder:text-zinc-600',
                    'focus:ring-1 focus:ring-violet-500/40'
                  )}
                  style={{
                    background: 'rgba(39,39,42,0.7)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    color: 'var(--color-text-primary)',
                    lineHeight: '1.5',
                  } as React.CSSProperties}
                  aria-label="Message input"
                />
                <button
                  aria-label="Emoji picker"
                  onClick={() => setShowEmojiPicker((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                  style={{ color: showEmojiPicker ? 'var(--color-violet)' : 'var(--color-text-muted)' }}
                >
                  <Smile className="h-4 w-4" />
                </button>

                {/* Emoji picker popover */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <EmojiPicker
                      onSelect={(emoji) => {
                        setText((prev) => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>

        {/* Send button or Voice/Image actions */}
        {canSend || sending ? (
          <motion.button
            id="send-btn"
            key="send"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handleSendText}
            disabled={!canSend || sending}
            aria-label="Send message"
            className={cn(
              "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150",
              sending ? "opacity-50" : "hover:opacity-90 active:scale-95 glow-violet-sm"
            )}
            style={{ background: 'var(--color-violet)', color: 'white' }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        ) : isRecording ? (
          <motion.button
            id="stop-voice-btn"
            key="stop-voice"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={stopRecording}
            aria-label="Send voice note"
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 hover:opacity-90 active:scale-95 shadow-[0_0_15px_rgba(239,68,68,0.3)]"
            style={{ background: 'rgb(239 68 68)', color: 'white' }}
          >
            <Send className="h-4 w-4" />
          </motion.button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              id="image-btn"
              aria-label="Send image"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 hover:bg-zinc-800/60"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Image className="h-4 w-4" />
            </button>
            <button
              id="voice-btn"
              aria-label="Record voice note"
              onClick={startRecording}
              disabled={sending}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 hover:bg-zinc-800/60"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Mic className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
