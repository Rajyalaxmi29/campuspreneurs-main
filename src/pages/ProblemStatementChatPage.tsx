import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProblemStatement {
  id: number;
  title: string;
  // Add other properties as needed
}

interface Department {
  id: number;
  name: string;
}

const ProblemStatementChatPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null
  );
  const [problemStatements, setProblemStatements] = useState<
    ProblemStatement[]
  >([]);
  const [selectedPs, setSelectedPs] = useState<ProblemStatement | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase.from("departments").select("*");
      if (error) {
        console.error("Error fetching departments:", error);
      } else {
        setDepartments(data);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchProblemStatements = async () => {
      let query = supabase.from("problem_statements").select("id, title");

      if (selectedDepartment) {
        query = query.eq("department", selectedDepartment);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching problem statements:", error);
      } else {
        setProblemStatements(data);
        setSelectedPs(null);
        setMessages([]);
      }
    };

    fetchProblemStatements();
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedPs) {
      const fetchMessages = async () => {
        const { data, error } = await supabase
          .from("problem_statement_messages")
          .select(
            `
            id,
            content,
            created_at,
            sender_id,
            profiles (
              full_name,
              avatar_url
            )
          `
          )
          .eq("problem_statement_id", selectedPs.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching messages:", error);
        } else {
          setMessages(data as Message[]);
        }
      };

      fetchMessages();
    }
  }, [selectedPs]);

  useEffect(() => {
    if (!selectedPs) return;

    const channel = supabase
      .channel(`ps-channel:${selectedPs.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "problem_statement_messages",
          filter: `problem_statement_id=eq.${selectedPs.id}`,
        },
        async (payload) => {
          const newMessageId = payload.new.id;
          const { data: newMessage, error } = await supabase
            .from("problem_statement_messages")
            .select(
              `
                    id,
                    content,
                    created_at,
                    sender_id,
                    profiles (
                        full_name,
                        avatar_url
                    )
                `
            )
            .eq("id", newMessageId)
            .single();

          if (error) {
            console.error("Error fetching new message details:", error);
          } else if (newMessage) {
            setMessages((prevMessages) => [
              ...prevMessages,
              newMessage as Message,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedPs]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "" || !selectedPs || !user) return;

    const { error } = await supabase.from("problem_statement_messages").insert([
      {
        problem_statement_id: selectedPs.id,
        sender_id: user.id,
        content: newMessage,
      },
    ]);

    if (error) {
      console.error("Error sending message:", error);
    } else {
      setNewMessage("");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Panel: Problem Statements List */}
          <Card className="md:col-span-1">
            <CardHeader className="bg-orange-500 rounded-t-lg">
              <CardTitle className="text-white">Problem Statements</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Select
                onValueChange={(value) => setSelectedDepartment(value)}
                defaultValue={selectedDepartment || ""}
              >
                <SelectTrigger className="w-full mb-4">
                  <SelectValue placeholder="Filter by Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <ScrollArea className="h-[52vh]">
                <div className="space-y-2">
                  {problemStatements.map((ps) => (
                    <div
                      key={ps.id}
                      className={`p-3 rounded-md cursor-pointer transition-colors ${
                        selectedPs?.id === ps.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedPs(ps)}
                    >
                      <p className="font-medium">{ps.title}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Right Panel: Chat View */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedPs ? (
              <>
                <CardHeader className="border-b">
                  <CardTitle>{selectedPs.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-[50vh] p-6">
                    <div className="space-y-6">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex items-start gap-4 ${
                            msg.sender_id === user?.id ? "justify-end" : ""
                          }`}
                        >
                          {msg.sender_id !== user?.id && (
                            <Avatar>
                              <AvatarImage
                                src={
                                  msg.profiles?.avatar_url ||
                                  `https://avatar.vercel.sh/${msg.sender_id}`
                                }
                              />
                              <AvatarFallback>
                                {msg.profiles?.full_name
                                  ? msg.profiles.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                  : "U"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                              msg.sender_id === user?.id
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="font-semibold text-sm mb-1">
                              {msg.profiles?.full_name || "User"}
                            </p>
                            <p className="text-sm">{msg.content}</p>
                            <p className="text-xs text-muted-foreground/80 mt-2 text-right">
                              {new Date(
                                msg.created_at
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          {msg.sender_id === user?.id && user.user_metadata.avatar_url && (
                            <Avatar>
                              <AvatarImage
                                src={
                                  user.user_metadata.avatar_url
                                }
                              />
                              <AvatarFallback>
                                {user.user_metadata.full_name
                                  ? user.user_metadata.full_name
                                      .split(" ")
                                      .map((n) => n[0])
                                      .join("")
                                  : "Me"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                    <div ref={messagesEndRef} />
                  </ScrollArea>
                </CardContent>
                <div className="p-4 border-t bg-background">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Type a message..."
                      className="pr-20"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleSendMessage()
                      }
                    />
                    <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  Select a problem statement to start chatting.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ProblemStatementChatPage;