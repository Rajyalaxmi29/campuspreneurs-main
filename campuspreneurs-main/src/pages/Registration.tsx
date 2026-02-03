import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Registration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [phoneError, setPhoneError] = useState<string>("");
  const [problemIdError, setProblemIdError] = useState<string>("");
  const [resolvedProblemUuid, setResolvedProblemUuid] = useState<string | null>(null);
  const [isValidatingProblemId, setIsValidatingProblemId] = useState(false);
  const [formData, setFormData] = useState({
    teamName: "",
    member1Name: "",
    member1Roll: "",
    member2Name: "",
    member2Roll: "",
    member3Name: "",
    member3Roll: "",
    member4Name: "",
    member4Roll: "",
    year: "",
    department: "",
    phone: "",
    email: "",
    problemId: "",
  });

  // No need to fetch problem IDs on mount anymore - validation is done on-demand

  // Validation functions
  const validatePhone = (phone: string): string => {
    if (!phone) return "";
    if (!/^\d+$/.test(phone)) return "Phone number must contain only numeric digits.";
    if (phone.length !== 10) return "Phone number must be exactly 10 digits.";
    if (!/^[6-9]/.test(phone)) return "Phone number must start with 6, 7, 8, or 9.";
    return "";
  };

  const validateAndResolveProblemId = async (problemId: string): Promise<{ error: string; uuid: string | null }> => {
    if (!problemId) return { error: "", uuid: null };

    try {
      const { data, error } = await supabase
        .from('problem_statements')
        .select('id')
        .eq('problem_statement_id', problemId)
        .single();

      if (error || !data) {
        return { error: "Invalid Problem ID", uuid: null };
      }

      return { error: "", uuid: data.id };
    } catch (error) {
      console.error('Error validating problem ID:', error);
      return { error: "Invalid Problem ID", uuid: null };
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Real-time validation
    if (name === "phone") {
      const error = validatePhone(value);
      setPhoneError(error);
    } else if (name === "problemId") {
      setIsValidatingProblemId(true);
      const { error, uuid } = await validateAndResolveProblemId(value);
      setProblemIdError(error);
      setResolvedProblemUuid(uuid);
      setIsValidatingProblemId(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleLoginRedirect = () => {
    localStorage.setItem('redirectAfterLogin', '/registration');
    navigate('/auth');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate before submission
    const phoneErr = validatePhone(formData.phone);
    let problemIdErr = "";
    let resolvedUuid = resolvedProblemUuid;

    // If we don't have a resolved UUID, try to validate and resolve it now
    if (!resolvedUuid && formData.problemId) {
      const { error, uuid } = await validateAndResolveProblemId(formData.problemId);
      problemIdErr = error;
      resolvedUuid = uuid;
    } else if (!resolvedUuid) {
      problemIdErr = "Invalid Problem ID";
    }

    setPhoneError(phoneErr);
    setProblemIdError(problemIdErr);

    if (phoneErr || problemIdErr || !resolvedUuid) {
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to register your team.",
          variant: "destructive",
        });
        return;
      }

      let documentUrl = null;

      // Upload file if selected
      if (selectedFile) {
        // Sanitize filename for storage key (remove/replace invalid characters)
        const sanitizedFileName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storageKey = `${user.id}_${Date.now()}_${sanitizedFileName}`;

        const { error: uploadError } = await supabase.storage
          .from("team-documents")
          .upload(storageKey, selectedFile);

        if (uploadError) {
          console.error(uploadError);
          toast({
            title: "Upload Failed",
            description: uploadError.message,
            variant: "destructive",
          });
          return;
        }

        documentUrl = storageKey;
      }

      // Insert registration data
      const { error: insertError } = await supabase
        .from('team_registrations')
        .insert({
          user_id: user.id,
          team_name: formData.teamName,
          problem_id: resolvedUuid,
          member1_name: formData.member1Name,
          member1_roll: formData.member1Roll,
          member2_name: formData.member2Name || null,
          member2_roll: formData.member2Roll || null,
          member3_name: formData.member3Name || null,
          member3_roll: formData.member3Roll || null,
          member4_name: formData.member4Name || null,
          member4_roll: formData.member4Roll || null,
          year: formData.year,
          department: formData.department,
          phone: formData.phone,
          email: formData.email,
          document_url: documentUrl,
          document_filename: selectedFile ? selectedFile.name : null,
        });

      if (insertError) {
        toast({
          title: "Registration Failed",
          description: "Failed to register team. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Success
      setIsSubmitted(true);
      toast({
        title: "Registration Successful!",
        description: "Your team has been registered for Campuspreneurs Chapter 1.",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Layout>
        <section className="min-h-[80vh] flex items-center justify-center bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-poppins font-bold text-foreground">
                Registration Complete!
              </h1>
              <p className="mt-4 text-muted-foreground">
                Thank you for registering for Campuspreneurs Chapter 1. You will receive a confirmation email shortly with further instructions.
              </p>
              <Button
                variant="default"
                size="lg"
                className="mt-8"
                onClick={() => setIsSubmitted(false)}
              >
                Register Another Team
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Header */}
      <section className="bg-primary py-16 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl lg:text-5xl font-poppins font-bold text-primary-foreground">
            Team Registration
          </h1>
          <p className="mt-4 text-primary-foreground/80 text-lg max-w-2xl mx-auto">
            Register your team for Campuspreneurs Chapter 1. Fill in all the required details below.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <form onSubmit={user ? handleSubmit : (e) => e.preventDefault()} className="max-w-2xl mx-auto">
            <div className="bg-card rounded-2xl shadow-card p-8 space-y-8">
              {!user && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 font-medium">
                    You must be logged in to register for this event.
                  </p>
                </div>
              )}
              {/* Team Info */}
              <div>
                <h3 className="font-poppins font-semibold text-lg text-foreground border-b border-border pb-3 mb-6">
                  Team Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      name="teamName"
                      required
                      value={formData.teamName}
                      onChange={handleInputChange}
                      disabled={!user}
                      className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Enter your team name"
                    />
                  </div>
                </div>
              </div>

              {/* Team Members */}
              <div>
                <h3 className="font-poppins font-semibold text-lg text-foreground border-b border-border pb-3 mb-6">
                  Team Members Details
                </h3>
                <div className="space-y-6">
                  {[1, 2, 3, 4].map((num) => (
                    <div key={num} className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Member {num} Name *
                        </label>
                        <input
                          type="text"
                          name={`member${num}Name`}
                          required
                          value={formData[`member${num}Name` as keyof typeof formData]}
                          onChange={handleInputChange}
                          disabled={!user}
                          className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder="Full name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">
                          Roll Number *
                        </label>
                        <input
                          type="text"
                          name={`member${num}Roll`}
                          required
                          value={formData[`member${num}Roll` as keyof typeof formData]}
                          onChange={handleInputChange}
                          disabled={!user}
                          className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                          placeholder="Roll number"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Academic Info */}
              <div>
                <h3 className="font-poppins font-semibold text-lg text-foreground border-b border-border pb-3 mb-6">
                  Academic Details
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Year *
                    </label>
                    <select
                      name="year"
                      required
                      value={formData.year}
                      onChange={handleInputChange}
                      disabled={!user}
                      className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Department *
                    </label>
                    <select
                      name="department"
                      required
                      value={formData.department}
                      onChange={handleInputChange}
                      disabled={!user}
                      className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">Select Department</option>
                      <option value="AIML">AIML</option>
                      <option value="CSE">CSE</option>
                      <option value="ECE">ECE</option>
                      <option value="EEE">EEE</option>
                      <option value="MECH">MECH</option>
                      <option value="CIVIL">CIVIL</option>
                      <option value="MBA">MBA</option>
                      <option value="PHARMACY">PHARMACY</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-poppins font-semibold text-lg text-foreground border-b border-border pb-3 mb-6">
                  Contact Information
                </h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!user}
                      className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                        phoneError ? "border-red-500" : "border-input"
                      } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="10-digit mobile number"
                    />
                    {phoneError && (
                      <p className="text-red-500 text-sm mt-1">{phoneError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!user}
                      className={`w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="Team contact email"
                    />
                  </div>
                </div>
              </div>

              {/* Problem Selection */}
              <div>
                <h3 className="font-poppins font-semibold text-lg text-foreground border-b border-border pb-3 mb-6">
                  Problem Selection
                </h3>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Problem ID *
                  </label>
                  <input
                    type="text"
                    name="problemId"
                    required
                    value={formData.problemId}
                    onChange={handleInputChange}
                    disabled={!user}
                    className={`w-full px-4 py-3 rounded-lg border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${
                      problemIdError ? "border-red-500" : "border-input"
                    } ${!user ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Enter problem ID (e.g., PS001)"
                  />
                  {problemIdError && (
                    <p className="text-red-500 text-sm mt-1">{problemIdError}</p>
                  )}
                </div>
              </div>

              {/* File Upload */}
              <div>
                <h3 className="font-poppins font-semibold text-lg text-foreground border-b border-border pb-3 mb-6">
                  Upload Documents
                </h3>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                  <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Drag and drop your files here, or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Accepted formats: PDF, PPT, PPTX (Max 10MB)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.ppt,.pptx"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={handleFileButtonClick}
                    disabled={!user}
                  >
                    Choose Files
                  </Button>
                  {selectedFile && (
                    <p className="text-sm text-foreground mt-2">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Submit */}
              {user ? (
                <Button
                  type="submit"
                  variant="orange"
                  size="xl"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Registration"}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="orange"
                  size="xl"
                  className="w-full"
                  onClick={handleLoginRedirect}
                >
                  Login to Register
                </Button>
              )}
            </div>
          </form>
        </div>
      </section>
    </Layout>
  );
}
