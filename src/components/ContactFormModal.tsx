import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';


interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedListings: string[];
    initialSuggestedEdit?: string;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
    isOpen,
    onClose,
    selectedListings,
    initialSuggestedEdit = '',
}) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        viberNumber: '',
        buyerType: 'Direct Buyer' as 'Broker' | 'Direct Buyer',
        additionalQuestions: '',
        privacyConsent: false,
    });

    // Initialize additionalQuestions with initialSuggestedEdit when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData(prev => ({
                ...prev,
                additionalQuestions: initialSuggestedEdit
            }));
        }
    }, [isOpen, initialSuggestedEdit]);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Reset form state on close
    useEffect(() => {
        if (!isOpen) {
            setSubmitStatus('idle');
        }
    }, [isOpen]);

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        // Viber Number validation
        if (!formData.viberNumber.trim()) {
            newErrors.viberNumber = 'Viber number is required';
        }

        // Buyer Type validation
        if (!formData.buyerType) {
            newErrors.buyerType = 'Please select buyer type';
        }

        // Privacy consent validation
        if (!formData.privacyConsent) {
            newErrors.privacyConsent = 'You must agree to the privacy policy';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        setSubmitStatus('idle');

        // Google Form Submission Logic
        // Form: 'Property Inquiry Form - NEW'
        const GOOGLE_FORM_ACTION_URL = "https://docs.google.com/forms/u/0/d/e/1FAIpQLSfrnFB16DKg_SqS0ZlaE3qRSBjvnwTG4-UdJlBuDqooMQlhQg/formResponse";

        const formBody = new FormData();
        // Mapping fields to Google Form Entry IDs
        formBody.append("entry.1988717347", formData.name); // Name
        formBody.append("entry.2007165317", formData.email); // Email
        formBody.append("entry.263297437", formData.viberNumber); // Contact Number (viber)
        formBody.append("entry.1547660235", formData.buyerType); // Direct Buyer or Broker
        formBody.append("entry.1495262169", selectedListings.join(', ')); // Selected Listings/s
        formBody.append("entry.1557413992", formData.additionalQuestions); // Additional Questions
        // Note: Privacy Consent checkbox not found in the Google Form

        try {
            await fetch(GOOGLE_FORM_ACTION_URL, {
                method: "POST",
                mode: "no-cors", // Important for submitting to Google Forms from client-side
                body: formBody
            });

            setSubmitStatus('success');

            // Close modal and reset form after success message
            setTimeout(() => {
                onClose();
                resetForm();
            }, 2000);
        } catch (error) {
            console.error("Form submission error:", error);
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            viberNumber: '',
            buyerType: 'Direct Buyer',
            additionalQuestions: '',
            privacyConsent: false,
        });
        setErrors({});
        setSubmitStatus('idle');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
                    <h2 className="text-2xl font-bold text-primary">Property Inquiry</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    {submitStatus === 'success' ? (
                        <div className="text-center py-8 px-6 flex-1 flex items-center justify-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-green-800 mb-2">Inquiry Submitted!</h3>
                            <p className="text-gray-600">Thank you for your interest. We will get back to you shortly.</p>
                        </div>
                    ) : (
                        <>
                            {/* Scrollable Form Fields */}
                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                                {submitStatus === 'error' && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
                                        <span className="block sm:inline">Something went wrong. Please try again.</span>
                                    </div>
                                )}

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Name <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Your Full Name"
                                        disabled={isSubmitting}
                                    />
                                    {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
                                </div>

                                {/* Email Address */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="your.email@example.com"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Viber Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Contact Number - Viber? <span className="text-red-600">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={formData.viberNumber}
                                        onChange={(e) => setFormData({ ...formData, viberNumber: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="+63 912 345 6789"
                                        disabled={isSubmitting}
                                    />
                                    {errors.viberNumber && <p className="text-red-600 text-xs mt-1">{errors.viberNumber}</p>}
                                </div>

                                {/* Buyer Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Direct Buyer or Broker <span className="text-red-600">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="buyerType"
                                                value="Direct Buyer"
                                                checked={formData.buyerType === 'Direct Buyer'}
                                                onChange={(e) => setFormData({ ...formData, buyerType: e.target.value as 'Direct Buyer' | 'Broker' })}
                                                className="w-4 h-4 text-primary border-gray-300 focus:ring-2 focus:ring-primary"
                                                disabled={isSubmitting}
                                            />
                                            <span className="text-sm text-gray-700">Direct Buyer</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="buyerType"
                                                value="Broker"
                                                checked={formData.buyerType === 'Broker'}
                                                onChange={(e) => setFormData({ ...formData, buyerType: e.target.value as 'Direct Buyer' | 'Broker' })}
                                                className="w-4 h-4 text-primary border-gray-300 focus:ring-2 focus:ring-primary"
                                                disabled={isSubmitting}
                                            />
                                            <span className="text-sm text-gray-700">Broker</span>
                                        </label>
                                    </div>
                                    {errors.buyerType && <p className="text-red-600 text-xs mt-1">{errors.buyerType}</p>}
                                </div>

                                {/* Selected Listings */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Selected Property
                                    </label>
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <p className="text-sm text-gray-600">
                                            {selectedListings.join(', ')}
                                        </p>
                                    </div>
                                </div>

                                {/* Additional Questions */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Suggested Edits
                                    </label>
                                    <textarea
                                        value={formData.additionalQuestions}
                                        onChange={(e) => setFormData({ ...formData, additionalQuestions: e.target.value })}
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        placeholder="Any specific questions about the selected properties..."
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {/* Privacy Consent Checkbox */}
                                <div>
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.privacyConsent}
                                            onChange={(e) => setFormData({ ...formData, privacyConsent: e.target.checked })}
                                            className="mt-1 w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                                            disabled={isSubmitting}
                                        />
                                        <span className="text-sm text-gray-700">
                                            I agree to the collection and processing of my personal information for the purpose of responding to my inquiry about the selected properties. My data will be handled in accordance with applicable privacy laws and will not be shared with third parties without my consent. <span className="text-red-600">*</span>
                                        </span>
                                    </label>
                                    {errors.privacyConsent && <p className="text-red-600 text-xs mt-1">{errors.privacyConsent}</p>}
                                </div>
                            </div>

                            {/* Submit Button at Bottom - Always Visible */}
                            <div className="bg-gray-50 border-t-2 border-gray-300 px-6 py-5 flex-shrink-0">
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full text-white py-4 rounded-xl font-extrabold text-lg transition-all shadow-xl
                                    ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-[#0b6439] hover:bg-green-800 hover:shadow-2xl'}`}
                                >
                                    {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};
