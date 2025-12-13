import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedListings: string[];
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
    isOpen,
    onClose,
    selectedListings,
}) => {
    const [formData, setFormData] = useState({
        email: '',
        viberNumber: '',
        buyerType: 'Direct Buyer' as 'Broker' | 'Direct Buyer',
        additionalQuestions: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [privacyAccepted, setPrivacyAccepted] = useState(false);

    // Simple CAPTCHA: random math question
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, answer: '' });
    const [captchaError, setCaptchaError] = useState('');

    // Generate new CAPTCHA on mount and when modal opens
    useEffect(() => {
        if (isOpen) {
            generateCaptcha();
        }
    }, [isOpen]);

    const generateCaptcha = () => {
        const num1 = Math.floor(Math.random() * 10) + 1;
        const num2 = Math.floor(Math.random() * 10) + 1;
        setCaptcha({ num1, num2, answer: '' });
        setCaptchaError('');
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Email validation
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Viber number validation
        if (!formData.viberNumber) {
            newErrors.viberNumber = 'Viber number is required';
        }

        // Privacy acceptance
        if (!privacyAccepted) {
            newErrors.privacy = 'You must accept the privacy policy';
        }

        // CAPTCHA validation
        const captchaAnswer = parseInt(captcha.answer);
        if (isNaN(captchaAnswer) || captchaAnswer !== captcha.num1 + captcha.num2) {
            setCaptchaError('Incorrect answer. Please try again.');
            generateCaptcha();
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Generate mailto link
        const subject = `Property Inquiry - ${selectedListings.length} Listing${selectedListings.length > 1 ? 's' : ''}`;

        const body = `
Hello,

I am interested in the following properties:
${selectedListings.join(', ')}

My Contact Information:
- Email: ${formData.email}
- Viber Number: ${formData.viberNumber}
- I am a: ${formData.buyerType}

${formData.additionalQuestions ? `Additional Questions/Comments:\n${formData.additionalQuestions}\n` : ''}
Thank you for your assistance.

Best regards
    `.trim();

        const mailtoLink = `mailto:leslie@luxerealtyph.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

        // Open user's email client
        window.location.href = mailtoLink;

        // Close modal and reset form after a short delay
        setTimeout(() => {
            onClose();
            resetForm();
        }, 500);
    };

    const resetForm = () => {
        setFormData({
            email: '',
            viberNumber: '',
            buyerType: 'Direct Buyer',
            additionalQuestions: '',
        });
        setPrivacyAccepted(false);
        setErrors({});
        generateCaptcha();
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                    <h2 className="text-2xl font-bold text-gray-900">Property Inquiry</h2>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="your.email@example.com"
                        />
                        {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                    </div>

                    {/* Viber Number */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Viber Number <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="tel"
                            value={formData.viberNumber}
                            onChange={(e) => setFormData({ ...formData, viberNumber: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="+63 912 345 6789"
                        />
                        {errors.viberNumber && <p className="text-red-600 text-xs mt-1">{errors.viberNumber}</p>}
                    </div>

                    {/* Buyer Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            I am a <span className="text-red-600">*</span>
                        </label>
                        <select
                            value={formData.buyerType}
                            onChange={(e) => setFormData({ ...formData, buyerType: e.target.value as 'Broker' | 'Direct Buyer' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="Direct Buyer">Direct Buyer</option>
                            <option value="Broker">Broker</option>
                        </select>
                    </div>

                    {/* Selected Listings */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Selected Properties
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
                            Additional Questions or Comments
                        </label>
                        <textarea
                            value={formData.additionalQuestions}
                            onChange={(e) => setFormData({ ...formData, additionalQuestions: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Any specific questions about the selected properties..."
                        />
                    </div>

                    {/* CAPTCHA */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Security Check <span className="text-red-600">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-gray-900">
                                {captcha.num1} + {captcha.num2} =
                            </span>
                            <input
                                type="number"
                                value={captcha.answer}
                                onChange={(e) => setCaptcha({ ...captcha, answer: e.target.value })}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="?"
                            />
                        </div>
                        {captchaError && <p className="text-red-600 text-xs mt-1">{captchaError}</p>}
                    </div>

                    {/* Privacy Agreement */}
                    <div>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={privacyAccepted}
                                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-600">
                                I agree to the collection and processing of my personal information for the purpose of
                                responding to my inquiry about the selected properties. My data will be handled in accordance
                                with applicable privacy laws and will not be shared with third parties without my consent.
                                <span className="text-red-600"> *</span>
                            </span>
                        </label>
                        {errors.privacy && <p className="text-red-600 text-xs mt-1">{errors.privacy}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                        Open Email to Send Inquiry
                    </button>

                    <p className="text-xs text-gray-500 text-center">
                        This will open your email app with a pre-filled message. Click Send to submit your inquiry.
                    </p>
                </form>
            </div>
        </div>
    );
};
