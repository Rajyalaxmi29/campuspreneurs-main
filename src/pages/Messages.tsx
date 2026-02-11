import React, { useEffect, useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/hooks/useAdmin";
import { toast } from "sonner";

interface MessageRow {
  id: string;
  department: string;
  sender_id: string | null;
  sender_name: string | null;
  message: string;
  created_at: string;
}

export default function MessagesPage() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [text, setText] = useState("");
  const { isAdmin } = useAdmin();
  const pollRef = useRef<number | null>(null);

  const fetchDepartments = async () => {
    const [{ data: fromProblems }, { data: fromRegs }] = await Promise.all([
      supabase.from("problem_statements").select("department"),
      supabase.from("team_registrations").select("department"),
    ]);
    const setDeps = new Set<string>();
    (fromProblems || []).forEach((r: any) => { if (r.department) setDeps.add(r.department); });
    (fromRegs || []).forEach((r: any) => { if (r.department) setDeps.add(r.department); });
    setDepartments(Array.from(setDeps).sort());
  };

  const fetchMessages = async (dept: string) => {
    const { data, error } = await supabase.from("department_messages").select("*").eq("department", dept).order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load messages");
      setMessages([]);
    } else {
      setMessages(data || []);
    }
  };

  useEffect(() => { fetchDepartments(); }, []);

  useEffect(() => {
    if (!selectedDept) return;
    fetchMessages(selectedDept);
    // polling
    pollRef.current = window.setInterval(() => fetchMessages(selectedDept), 2000);
    return () => { if (pollRef.current) window.clearInterval(pollRef.current); };
  }, [selectedDept]);

  const sendMessage = async () => {
    if (!selectedDept || !text.trim()) return;
    try {
      const { error } = await supabase.from("department_messages").insert([{
        department: selectedDept,
        sender_id: null,
        sender_name: "Admin",
        message: text.trim(),
      }]);
      if (error) throw error;
      setText("");
      fetchMessages(selectedDept);
    } catch (err: any) { toast.error(err.message || "Failed to send"); }
  };

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-4">Messages</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {departments.map((d) => (
            <button key={d} onClick={() => setSelectedDept(d)} className={`p-4 rounded border ${selectedDept===d?"border-secondary":"border-border"}`}>
              {d}
            </button>
          ))}
        </div>

        {!selectedDept ? (
          <p>Select a department to view messages.</p>
        ) : (
          <div className="bg-card rounded p-4">
            <div className="h-96 overflow-auto mb-4 space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="p-3 rounded border border-border">
                  <div className="text-sm text-muted-foreground">{m.sender_name || m.sender_id || 'Dept'}</div>
                  <div>{m.message}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(m.created_at).toLocaleString()}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 p-2 border rounded"
                rows={3}
                placeholder="Type your message..."
                aria-label="Message text"
              />
              <div className="flex flex-col">
                <Button onClick={sendMessage}>Send</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
