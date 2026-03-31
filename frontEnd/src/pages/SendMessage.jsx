import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { ClipLoader } from 'react-spinners';

const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(2, 'Message must be at least 2 characters').max(10000, 'Message too long'),
});

const SendMessage = () => {
  const [formData, setFormData] = useState({ receiverId: '', content: '' });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const receiverId = searchParams.get('receiverId');
    if (receiverId) {
      setFormData(prev => ({ ...prev, receiverId }));
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    try {
      sendMessageSchema.parse(formData);
      setLoading(true);

      const formDataToSend = new FormData();
      formDataToSend.append('content', formData.content);
      attachments.forEach((file) => {
        formDataToSend.append('attachments', file);
      });

      // If user is logged in, include auth header
      const config = user ? {} : { headers: {} };

      await axios.post(`/message/${formData.receiverId}`, formDataToSend, config);

      toast.success('Message sent successfully!');
      setFormData({ receiverId: '', content: '' });
      setAttachments([]);
      if (user) {
        navigate('/dashboard');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors = {};
        error.errors.forEach((err) => {
          fieldErrors[err.path[0]] = err.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to send message' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-blue-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-white opacity-10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300 opacity-10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-300 opacity-5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 flex justify-center items-center min-h-screen px-4 py-12">
        <div className="bg-white/10 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-lg border border-white/20">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Send Anonymous Message</h1>
            <p className="text-white/80 text-lg">Share your thoughts with complete privacy</p>
            
            {/* Show promotional content only if user is not signed in */}
            {!user && (
              <div className="mt-4">
                <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 mb-4">
                  <p className="text-white/90 text-sm text-center">
                    💡 <strong>Want to receive messages too?</strong> Create your account and get your own profile where others can send you anonymous messages!
                  </p>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => navigate('/signup')}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-3 px-6 rounded-2xl transition-all shadow-xl font-semibold text-lg flex items-center justify-center transform hover:scale-105 mx-auto max-w-xs"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center mt-4 space-x-2">
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-75"></div>
              <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse delay-150"></div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Receiver ID Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-white/90 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Receiver ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="receiverId"
                  value={formData.receiverId}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white/20 border border-white/30 rounded-2xl focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all text-white placeholder-white/60 backdrop-blur-sm"
                  placeholder="Enter receiver ID..."
                  readOnly
                  required
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              {errors.receiverId && (
                <p className="text-red-300 text-sm mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.receiverId}
                </p>
              )}
            </div>

            {/* Message Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-white/90 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Your Message
              </label>
              <div className="relative">
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white/20 border border-white/30 rounded-2xl focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all text-white placeholder-white/60 backdrop-blur-sm resize-none"
                  rows="5"
                  placeholder="Write your anonymous message here... Be kind and respectful 💝"
                  required
                />
                <div className="absolute bottom-3 right-3 text-white/60 text-sm">
                  {formData.content.length}/10000
                </div>
              </div>
              {errors.content && (
                <p className="text-red-300 text-sm mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.content}
                </p>
              )}
            </div>

            {/* Attachments Field */}
            <div className="relative">
              <label className="block text-sm font-semibold text-white/90 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Attachments <span className="text-white/60 text-xs ml-1">(optional, max 3 images)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full px-5 py-4 bg-white/20 border border-white/30 rounded-2xl focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all text-white file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-white/30 file:text-white hover:file:bg-white/40 backdrop-blur-sm"
                />
                {attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {file.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4">
                <p className="text-red-300 text-sm text-center flex items-center justify-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.general}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-400 to-blue-500 hover:from-green-500 hover:to-blue-600 text-white py-4 px-6 rounded-2xl transition-all shadow-xl font-semibold text-lg flex items-center justify-center transform hover:scale-105 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ClipLoader color="#ffffff" size={24} className="mr-3" />
                  Sending your message...
                </>
              ) : (
                <>
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  Send Anonymous Message
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          {user && (
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-white/80 hover:text-white font-medium transition-colors flex items-center justify-center mx-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Dashboard
              </button>
            </div>
          )}

          {/* Decorative Elements */}
          <div className="absolute -top-4 -right-4 w-8 h-8 bg-white/20 rounded-full blur-sm"></div>
          <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-white/20 rounded-full blur-sm"></div>
        </div>
      </div>
    </div>
  );
};

export default SendMessage;