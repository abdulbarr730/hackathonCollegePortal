'use client';

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.44.0';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Icons using inline SVG for no external dependencies
const ChatIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path fillRule="evenodd" d="M4.848 2.766A2.25 2.25 0 0 1 6.826 1.5h10.348c1.085 0 2.062.502 2.678 1.266A2.25 2.25 0 0 1 21 4.5v1.272c0 .546-.226 1.062-.638 1.432L17.15 9.873a2.25 2.25 0 0 1-1.397.627H9.5a2.25 2.25 0 0 1-1.397-.627l-3.212-2.665A2.25 2.25 0 0 1 3 5.772V4.5c0-.853.376-1.611.966-2.134ZM21 12a2.25 2.25 0 0 1-2.25 2.25H15a.75.75 0 0 0-.627 1.219l4.5 4.5a.75.75 0 0 0 1.06 0l1.22-1.22a.75.75 0 0 0-.02-1.06L18.474 15H21a.75.75 0 0 0 0-1.5Z" clipRule="evenodd" />
    </svg>
);

const GeminiSparkles = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-indigo-400">
        <path fillRule="evenodd" d="M9.303 2.25c.879 0 1.583.693 1.583 1.569v3.023h3.023A1.583 1.583 0 0 1 15.49 8.423v3.024h3.023c.879 0 1.584.694 1.584 1.569v3.023h-3.024A1.583 1.583 0 0 1 15.49 18.25h-3.023v3.023c0 .879-.704 1.583-1.583 1.583H6.28c-.879 0-1.583-.704-1.583-1.583v-3.023H1.674A1.583 1.583 0 0 1 .09 15.49v-3.024h3.024a1.583 1.583 0 0 1 1.583-1.569v-3.023H7.72c.879 0 1.583-.694 1.583-1.584V2.25Z" clipRule="evenodd" />
    </svg>
);

// Define a simple modal for confirmations
const ConfirmationModal = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-70 z-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 max-w-sm w-full"
            >
                <p className="text-slate-300 mb-6 text-center">{message}</p>
                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-slate-400 rounded-lg hover:bg-slate-700 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition"
                    >
                        Confirm
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// Mock user for the Gemini Assistant
const geminiAssistant = {
    _id: 'gemini-assistant',
    name: '✨ Gemini Assistant',
    team: null,
    photoUrl: '/gemini-icon.svg',
};

export default function Chat({ currentUser, allUsers, teams }) {
    // Supabase client and user state
    const [supabaseClient, setSupabaseClient] = useState(null);
    const [supabaseUser, setSupabaseUser] = useState(null);

    // Chat state
    const [conversations, setConversations] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Memoized user and team data
    const myTeamId = useMemo(() => currentUser?.team || null, [currentUser]);
    const myTeamMembers = useMemo(() => {
        const myTeam = teams?.find(t => String(t._id) === String(myTeamId));
        return myTeam ? myTeam.members.map(m => String(m._id)) : [];
    }, [teams, myTeamId]);
    
    // Convert MERN user IDs to Supabase IDs for chat
    const allChattableUsers = useMemo(() => {
        const users = allUsers.map(u => ({ ...u, supabaseId: u._id }));
        return [geminiAssistant, ...users];
    }, [allUsers]);

    // Effect for Supabase initialization and auth
    useEffect(() => {
        const initSupabase = async () => {
            try {
                // Fetch the Supabase JWT from your Express backend
                const tokenRes = await fetch('/api/auth/supabase-token');
                if (!tokenRes.ok) {
                    throw new Error('Failed to get Supabase token.');
                }
                const { token, config } = await tokenRes.json();
                
                const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

                const { data: { user } } = await supabase.auth.signInWithIdToken({
                    provider: 'google', // Or any other provider
                    token: token,
                });
                
                setSupabaseClient(supabase);
                setSupabaseUser(user);
                setIsLoading(false);
            } catch (error) {
                console.error("Supabase Initialization Error:", error);
                setIsLoading(false);
            }
        };

        initSupabase();
    }, []);

    // Effect for real-time conversations and unread count
    useEffect(() => {
        if (!supabaseClient || !supabaseUser) return;
        
        // This is a simplified listener. In production, we'd use more specific queries.
        const channel = supabaseClient.channel('realtime_chat')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'conversations' },
                (payload) => {
                    fetchConversations();
                }
            )
            .subscribe();

        const fetchConversations = async () => {
            const { data, error } = await supabaseClient
                .from('conversations')
                .select('*')
                .contains('participants', [supabaseUser.id]);
            
            if (error) {
                console.error("Error fetching conversations:", error);
                return;
            }
            
            setConversations(data);
            const count = data.reduce((sum, conv) => sum + (conv.unread?.[supabaseUser.id] || 0), 0);
            setUnreadCount(count);
        };
        
        fetchConversations();
        
        return () => {
            supabaseClient.removeChannel(channel);
        };
    }, [supabaseClient, supabaseUser]);

    // Handle chat panel visibility
    const handleToggleChatPanel = () => {
        setIsChatPanelOpen(!isChatPanelOpen);
        if (activeChat) {
            setActiveChat(null); // Go back to the chat list
        }
    };

    // Open a specific chat
    const handleOpenChat = useCallback(async (otherUser) => {
        if (!supabaseClient || !supabaseUser) return;

        // Special logic for Gemini Assistant
        if (otherUser._id === 'gemini-assistant') {
            const geminiChat = conversations.find(c => c.other_id === geminiAssistant._id);
            if (geminiChat) {
                setActiveChat({
                    id: geminiChat.id,
                    otherUser,
                    messages: geminiChat.messages,
                    status: 'active',
                });
            } else {
                setActiveChat({
                    id: null,
                    otherUser,
                    messages: [],
                    status: 'active',
                });
            }
            return;
        }

        // Check for existing conversation
        const { data, error } = await supabaseClient
            .from('conversations')
            .select('*')
            .contains('participants', [otherUser.supabaseId, supabaseUser.id]);

        let conversationId;
        let isTeamChat = myTeamId && otherUser.team && (String(myTeamId) === String(otherUser.team));

        if (data && data.length > 0) {
            conversationId = data[0].id;
        } else {
            // Create a new conversation
            const newChatData = {
                participants: [supabaseUser.id, otherUser.supabaseId],
                messages: [],
                status: isTeamChat ? 'active' : 'pending',
                unread: { [supabaseUser.id]: 0, [otherUser.supabaseId]: 0 },
                last_updated_at: new Date().toISOString()
            };
            const { data: newConvData, error: insertError } = await supabaseClient
                .from('conversations')
                .insert([newChatData])
                .select();
            
            if (insertError) {
                console.error("Error creating conversation:", insertError);
                return;
            }
            conversationId = newConvData[0].id;
        }

        const foundChat = conversations.find(c => c.id === conversationId);
        setActiveChat({
            id: conversationId,
            otherUser,
            isTeamChat,
            ...foundChat
        });
        
        // Reset unread count for this chat
        if (foundChat && foundChat.unread?.[supabaseUser.id] > 0) {
            const updates = { unread: { ...foundChat.unread, [supabaseUser.id]: 0 } };
            await supabaseClient
                .from('conversations')
                .update(updates)
                .eq('id', conversationId);
        }

    }, [supabaseClient, supabaseUser, conversations, myTeamId]);
    
    // Accept a message request
    const handleAcceptRequest = useCallback(async (chatId) => {
        if (!supabaseClient) return;
        
        await supabaseClient
            .from('conversations')
            .update({ status: 'active' })
            .eq('id', chatId);

        setActiveChat(prev => ({ ...prev, status: 'active' }));
    }, [supabaseClient]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        const input = document.getElementById('message-input');
        const messageText = input.value.trim();
        if (!messageText || !activeChat || !supabaseUser) return;

        // If talking to Gemini Assistant, use the LLM logic
        if (activeChat.otherUser._id === 'gemini-assistant') {
            await handleSendMessageToGemini(messageText);
            input.value = '';
            return;
        }

        const newMessage = {
            text: messageText,
            senderId: supabaseUser.id,
            timestamp: new Date().toISOString()
        };
        
        const existingMessages = activeChat.messages || [];
        const updatedMessages = [...existingMessages, newMessage];
        const updates = {
            messages: updatedMessages,
            unread: { ...activeChat.unread, [activeChat.otherUser.supabaseId]: (activeChat.unread?.[activeChat.otherUser.supabaseId] || 0) + 1 },
            last_updated_at: new Date().toISOString()
        };

        const { error } = await supabaseClient
            .from('conversations')
            .update(updates)
            .eq('id', activeChat.id);

        if (error) console.error("Error sending message:", error);
        
        input.value = '';
    };
    
    const handleSendMessageToGemini = async (messageText) => {
        setIsGenerating(true);
        const userMessage = { text: messageText, senderId: supabaseUser.id, timestamp: new Date().toISOString() };
        
        const existingMessages = activeChat?.messages || [];
        const updatedMessages = [...existingMessages, userMessage];
        
        setActiveChat(prev => ({ ...prev, messages: updatedMessages }));

        try {
            const res = await fetch('/api/gemini/generate-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: messageText }),
            });
            const data = await res.json();
            
            if (res.ok && data.generatedText) {
                const geminiMessage = {
                    text: data.generatedText,
                    senderId: geminiAssistant._id,
                    timestamp: new Date().toISOString(),
                };
                const finalMessages = [...updatedMessages, geminiMessage];
                setActiveChat(prev => ({ ...prev, messages: finalMessages }));

                // Save to Supabase for persistence
                let convId = activeChat.id;
                if (!convId) {
                    const { data: newConvData, error: insertError } = await supabaseClient
                        .from('conversations')
                        .insert([{
                            participants: [supabaseUser.id, geminiAssistant._id],
                            messages: finalMessages,
                            status: 'active',
                            last_updated_at: new Date().toISOString()
                        }])
                        .select();
                    if (insertError) throw insertError;
                    convId = newConvData[0].id;
                    setActiveChat(prev => ({ ...prev, id: convId }));
                } else {
                    await supabaseClient
                        .from('conversations')
                        .update({ messages: finalMessages, last_updated_at: new Date().toISOString() })
                        .eq('id', convId);
                }
            } else {
                console.error('Gemini API Error:', data.msg || 'Unknown error');
                const errorMessage = { text: 'Sorry, I could not generate a response. Please try again.', senderId: geminiAssistant._id, timestamp: new Date().toISOString() };
                setActiveChat(prev => ({ ...prev, messages: [...updatedMessages, errorMessage] }));
            }
        } catch (error) {
            console.error("Fetch error:", error);
            const errorMessage = { text: 'Sorry, I could not connect to the assistant. Please try again.', senderId: geminiAssistant._id, timestamp: new Date().toISOString() };
            setActiveChat(prev => ({ ...prev, messages: [...updatedMessages, errorMessage] }));
        } finally {
            setIsGenerating(false);
        }
    };


    // Conditional rendering for content
    const renderContent = () => {
        if (isLoading) {
            return <div className="p-4 text-center text-slate-400">Connecting to chat...</div>;
        }

        if (activeChat) {
            const isRequestPending = activeChat.status === 'pending';
            const isGeminiChat = activeChat.otherUser._id === 'gemini-assistant';

            const chat = conversations.find(c => c.id === activeChat.id) || activeChat;

            return (
                <div className="flex flex-col h-full bg-slate-900/90 rounded-b-xl">
                    <div className="flex items-center gap-4 p-4 border-b border-slate-700/50">
                        <button onClick={() => setActiveChat(null)} className="text-slate-400 hover:text-white transition">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                            </svg>
                        </button>
                        <h3 className="text-lg font-semibold text-slate-100">{activeChat.otherUser.name}</h3>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chat?.messages?.map((msg, index) => {
                            const isOutgoing = msg.senderId === supabaseUser.id;
                            const isBot = msg.senderId === geminiAssistant._id;
                            return (
                                <div key={index} className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[70%] p-3 rounded-lg ${isOutgoing ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-700 text-slate-200 rounded-bl-none'}`}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            );
                        })}
                        {isGenerating && (
                            <div className="flex justify-start">
                                <div className="max-w-[70%] p-3 rounded-lg bg-slate-700 text-slate-200 rounded-bl-none animate-pulse">
                                    <p className="text-sm">Gemini is typing...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {isRequestPending && (
                        <div className="p-4 text-center border-t border-slate-700/50">
                            <p className="text-slate-400 text-sm mb-2">
                                <span className="font-semibold text-cyan-400">{activeChat.otherUser.name}</span> wants to start a chat.
                            </p>
                            <button
                                onClick={() => handleAcceptRequest(activeChat.id)}
                                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 transition"
                            >
                                Accept Chat
                            </button>
                        </div>
                    )}
                    
                    {!isRequestPending && !isGenerating && (
                        <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-700/50 flex gap-3">
                            <input
                                id="message-input"
                                type="text"
                                placeholder={isGeminiChat ? "Ask the assistant about your project..." : "Send a message..."}
                                className="flex-1 px-4 py-2 bg-slate-800 text-slate-200 border border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                            />
                            <button type="submit" className="p-3 bg-indigo-600 text-white rounded-full hover:bg-indigo-500 transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.498 12 59.769 59.769 0 0 1 3.27 20.875L5.25 18M12 12h-9.75" />
                                </svg>
                            </button>
                        </form>
                    )}
                </div>
            );
        }

        // Chat List View
        const otherUsers = allChattableUsers.filter(u => u._id !== currentUser._id);
        const myUserIdString = String(currentUser._id);

        return (
            <div className="h-full flex flex-col p-4">
                <h3 className="text-xl font-semibold text-slate-100 mb-4">Users</h3>
                <ul className="space-y-3 overflow-y-auto">
                    {otherUsers.map(user => {
                        const isTeamMember = myTeamMembers.includes(String(user._id));
                        const isGemini = user._id === geminiAssistant._id;
                        return (
                            <li
                                key={user._id}
                                className="p-4 bg-slate-800/50 rounded-lg flex items-center justify-between transition duration-150 hover:bg-slate-700/50 cursor-pointer"
                                onClick={() => handleOpenChat(user)}
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-200 flex items-center gap-2">
                                        {isGemini && <GeminiSparkles />}
                                        {user.name}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {isGemini ? 'AI Assistant' : isTeamMember ? 'On your team' : 'Individual Chat'}
                                    </span>
                                </div>
                                {!isGemini && (
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isTeamMember ? 'bg-green-600 text-green-100' : 'bg-indigo-600 text-indigo-100'}`}>
                                        {isTeamMember ? 'Team' : 'Personal'}
                                    </span>
                                )}
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    };

    return (
        <>
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmAction}
                message="Are you sure you want to delete this conversation? This action cannot be undone."
            />
            
            {/* Chat Icon in Navbar */}
            <button onClick={handleToggleChatPanel} className="relative p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-white transition">
                <ChatIcon />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full transform translate-x-1/2 -translate-y-1/2">
                        {unreadCount}
                    </span>
                )}
            </button>
            
            {/* Chat Panel */}
            <AnimatePresence>
                {isChatPanelOpen && (
                    <motion.div
                        initial={{ opacity: 0, x: '100%' }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: '100%' }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-900/95 shadow-xl z-40 flex flex-col"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
                            <h2 className="text-2xl font-bold text-slate-100">
                                {activeChat ? activeChat.otherUser.name : 'Messages'}
                            </h2>
                            <button onClick={handleToggleChatPanel} className="p-2 text-slate-400 hover:text-white transition">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {renderContent()}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
