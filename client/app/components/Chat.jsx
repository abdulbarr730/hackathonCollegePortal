"use client";

import React, { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { createClient } from "@supabase/supabase-js";

// --- Supabase Setup ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase credentials in environment variables.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Icons ---
const ChatIcon = () => (
  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.8-4A7.94 7.94 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SendIcon = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M5 13l4 4L19 7" />
  </svg>
);

// --- Main Chat Component ---
export default function ChatUI() {
  const [isOpen, setIsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [geminiTyping, setGeminiTyping] = useState(false);
  const bottomRef = useRef(null);

  // Fetch available users
  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data, error } = await supabase.from("users").select("*");
        if (error) throw error;
        setUsers(data || []);
      } catch (err) {
        console.error("Failed to fetch users:", err.message);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 p-4 rounded-full shadow-lg"
        >
          <ChatIcon />
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="chat-panel w-80 h-[450px] bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-3 border-b">
            <span className="font-semibold text-lg">Chat</span>
            <button onClick={() => setIsOpen(false)}>
              <CloseIcon />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex">
            {!selectedUser ? (
              <UserList users={users} setSelectedUser={setSelectedUser} />
            ) : (
              <ChatMessagesPanel
                user={selectedUser}
                messages={messages}
                setMessages={setMessages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                sending={sending}
                setSending={setSending}
                geminiTyping={geminiTyping}
                setGeminiTyping={setGeminiTyping}
                bottomRef={bottomRef}
                setSelectedUser={setSelectedUser}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// --- User List Component ---
function UserList({ users, setSelectedUser }) {
  return (
    <div className="flex-1 overflow-y-auto">
      {users.length === 0 ? (
        <p className="text-center text-gray-500 mt-4">No users found</p>
      ) : (
        users.map((user) => (
          <div
            key={user.id}
            className="p-3 border-b hover:bg-gray-100 cursor-pointer"
            onClick={() => setSelectedUser(user)}
          >
            <span className="font-medium">{user.name}</span>
          </div>
        ))
      )}
    </div>
  );
}
// --- Chat Messages Panel Component ---
function ChatMessagesPanel({
  user,
  messages,
  setMessages,
  newMessage,
  setNewMessage,
  sending,
  setSending,
  geminiTyping,
  setGeminiTyping,
  bottomRef,
  setSelectedUser,
}) {
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Fetch chat messages
  useEffect(() => {
    async function fetchMessages() {
      setLoadingMessages(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*")
          .eq("recipientId", user.id)
          .order("created_at", { ascending: true });

        if (error) throw error;
        setMessages(data || []);
        markMessagesAsSeen(user.id);
      } catch (err) {
        console.error("Failed to fetch messages:", err.message);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [user.id, setMessages]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Send message handler
  async function handleSend() {
    if (!newMessage.trim()) return;
    setSending(true);

    const optimisticMessage = {
      id: Date.now(),
      text: newMessage,
      sender: "me",
      created_at: new Date().toISOString(),
      seenBy: [],
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setNewMessage("");

    try {
      const { error } = await supabase.from("messages").insert({
        recipientId: user.id,
        text: optimisticMessage.text,
        sender: "me",
      });
      if (error) throw error;

      // Simulate Gemini reply
      setGeminiTyping(true);
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-gemini`,
            text: "This is a Gemini-generated response 🤖",
            sender: "assistant",
            created_at: new Date().toISOString(),
            seenBy: [],
          },
        ]);
        setGeminiTyping(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to send message:", err.message);
    } finally {
      setSending(false);
    }
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <button
          onClick={() => setSelectedUser(null)}
          className="text-blue-600 hover:underline text-sm"
        >
          ← Back
        </button>
        <span className="font-semibold">{user.name}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50">
        {loadingMessages ? (
          <p className="text-center text-gray-500">Loading messages...</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[75%] ${
                msg.sender === "me" ? "ml-auto items-end" : "items-start"
              }`}
            >
              <div
                className={`px-4 py-2 rounded-2xl shadow-sm text-sm whitespace-pre-line
                  ${
                    msg.sender === "me"
                      ? "bg-blue-600 text-white"
                      : msg.sender === "assistant"
                      ? "bg-green-100 text-gray-900"
                      : "bg-gray-200 text-gray-900"
                  }`}
              >
                {msg.text}
              </div>
              {/* Timestamp + Read Receipt */}
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <span>{formatTime(msg.created_at)}</span>
                {msg.sender === "me" && (
                  <span>{msg.seenBy?.length > 0 ? "✓✓" : "✓"}</span>
                )}
              </div>
            </div>
          ))
        )}
        {geminiTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          disabled={sending}
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg disabled:opacity-50"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  );
}
// --- Typing Indicator ---
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 text-gray-500 text-sm">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-300"></span>
      <span>Gemini is typing...</span>
    </div>
  );
}

// --- Mark Messages as Seen Helper ---
async function markMessagesAsSeen(userId) {
  try {
    const { error } = await supabase
      .from("messages")
      .update({ seenBy: ["me"] })
      .eq("recipientId", userId)
      .is("seenBy", null);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to mark messages as seen:", err.message);
  }
}

// --- Main Chat Component ---
export default function Chat() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [geminiTyping, setGeminiTyping] = useState(false);

  const bottomRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Animate chat panel open/close
  useEffect(() => {
    if (chatContainerRef.current) {
      gsap.fromTo(
        chatContainerRef.current,
        { x: 50, opacity: 0 },
        { x: 0, opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [selectedUser]);

  return (
    <div className="flex h-screen bg-white">
      {/* Left Sidebar */}
      <div className="w-1/3 border-r">
        <UserList setSelectedUser={setSelectedUser} />
      </div>

      {/* Right Panel */}
      <div className="flex-1" ref={chatContainerRef}>
        {selectedUser ? (
          <ChatMessagesPanel
            user={selectedUser}
            messages={messages}
            setMessages={setMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sending={sending}
            setSending={setSending}
            geminiTyping={geminiTyping}
            setGeminiTyping={setGeminiTyping}
            bottomRef={bottomRef}
            setSelectedUser={setSelectedUser}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
