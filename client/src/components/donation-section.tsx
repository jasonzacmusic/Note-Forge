import { useState } from "react";
import { Heart, CreditCard, Smartphone, Building2, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import upiQrCode from "@/assets/upi-qr-code.png";

type PaymentMethod = "paypal" | "upi" | null;

export function DonationSection() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [customAmount, setCustomAmount] = useState("10");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const PAYPAL_EMAIL = "music@nathanielschool.com";

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handlePayPalPayment = () => {
    const amount = parseFloat(customAmount) || 10;
    const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=${encodeURIComponent(PAYPAL_EMAIL)}&item_name=${encodeURIComponent("Support Nathaniel School of Music Development")}&amount=${amount}&currency_code=USD`;
    window.open(paypalUrl, "_blank");
  };

  const bankDetails = {
    accountName: "Nathaniel School Of Music",
    accountNumber: "50200038076306",
    ifscCode: "HDFC0001748",
    branch: "No 196, 10th Cross, Wilson Garden, Bangalore - 560027",
    gstin: "29AAOPZ2178C1Z5",
    upiName: "Jason Zachariah",
    upiNumber: "9845465411",
    upiId: "jasonzac-1@okhdfcbank"
  };

  return (
    <section className="mt-8 mb-4">
      <div className="container mx-auto px-3 md:px-6 max-w-7xl">
        <div className="app-surface rounded-xl overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--app-elevated)] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-semibold app-text-primary">Support Our Mission</h3>
                <p className="text-sm app-text-secondary">Help us continue building free music education tools</p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 app-text-secondary" />
            ) : (
              <ChevronDown className="w-5 h-5 app-text-secondary" />
            )}
          </button>

          {isExpanded && (
            <div className="px-6 pb-6 border-t border-[var(--app-border)]">
              <div className="pt-6">
                <p className="app-text-secondary mb-6 text-center max-w-2xl mx-auto">
                  Your donation helps Nathaniel School of Music create free educational resources 
                  and develop innovative tools for music students worldwide. Every contribution makes a difference!
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setSelectedMethod("paypal")}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === "paypal"
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-[var(--app-border)] hover:border-blue-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <CreditCard className="w-6 h-6 text-blue-500" />
                      <span className="font-semibold app-text-primary">PayPal</span>
                    </div>
                    <p className="text-sm app-text-secondary">
                      Secure international payments via PayPal
                    </p>
                  </button>

                  <button
                    onClick={() => setSelectedMethod("upi")}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === "upi"
                        ? "border-green-500 bg-green-500/10"
                        : "border-[var(--app-border)] hover:border-green-500/50"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <Smartphone className="w-6 h-6 text-green-500" />
                      <span className="font-semibold app-text-primary">UPI / Bank Transfer</span>
                      <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded-full">India</span>
                    </div>
                    <p className="text-sm app-text-secondary">
                      For Indian students - Pay via UPI or direct bank transfer
                    </p>
                  </button>
                </div>

                {selectedMethod === "paypal" && (
                  <div className="mt-6 p-6 app-bg rounded-xl">
                    <h4 className="font-semibold app-text-primary mb-4 text-center">Support Development</h4>
                    
                    <div className="max-w-xs mx-auto">
                      <label className="block text-sm app-text-secondary mb-2">Enter Amount (USD)</label>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-xl font-bold app-text-primary">$</span>
                        <input
                          type="number"
                          min="1"
                          step="0.01"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="10.00"
                          className="flex-1 px-4 py-3 rounded-lg app-elevated border border-[var(--app-border)] app-text-primary focus:outline-none focus:border-blue-500 text-center text-lg font-semibold"
                        />
                      </div>

                      <Button
                        onClick={handlePayPalPayment}
                        className="w-full bg-[#0070ba] hover:bg-[#005ea6] text-white py-4 text-lg font-semibold rounded-lg flex items-center justify-center gap-2"
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.566 6.082-7.356 6.082H10.2c-.508 0-.94.37-1.019.875l-1.078 6.839-.306 1.943a.61.61 0 0 0 .603.703h3.95a.86.86 0 0 0 .85-.73l.033-.178.67-4.25.043-.233a.86.86 0 0 1 .85-.73h.536c3.47 0 6.185-1.41 6.98-5.488.333-1.704.16-3.13-.719-4.126a3.5 3.5 0 0 0-1.4-.92z"/>
                        </svg>
                        Pay Now
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>

                    <p className="text-xs app-text-secondary text-center mt-4">
                      Secure payment processed by PayPal. You'll be redirected to complete your payment.
                    </p>
                  </div>
                )}

                {selectedMethod === "upi" && (
                  <div className="mt-6 p-6 app-bg rounded-xl">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="text-center">
                        <h4 className="font-semibold app-text-primary mb-4 flex items-center justify-center gap-2">
                          <Smartphone className="w-5 h-5 text-green-500" />
                          Scan to Pay with UPI
                        </h4>
                        <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
                          <img 
                            src={upiQrCode} 
                            alt="UPI QR Code - Jason Zachariah" 
                            className="w-48 h-48 object-contain"
                          />
                        </div>
                        <p className="mt-3 text-sm app-text-secondary">
                          Scan with any UPI app (GPay, PhonePe, Paytm, etc.)
                        </p>
                        
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-sm app-text-secondary">UPI ID:</span>
                            <code className="px-2 py-1 app-elevated rounded text-sm font-mono app-text-primary">
                              {bankDetails.upiId}
                            </code>
                            <button
                              onClick={() => copyToClipboard(bankDetails.upiId, "upiId")}
                              className="p-1 hover:bg-[var(--app-elevated)] rounded"
                            >
                              {copiedField === "upiId" ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4 app-text-secondary" />
                              )}
                            </button>
                          </div>
                          <p className="text-sm app-text-secondary">
                            Name: {bankDetails.upiName} | Phone: {bankDetails.upiNumber}
                          </p>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold app-text-primary mb-4 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-500" />
                          Bank Transfer Details (NEFT/RTGS)
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="p-3 app-elevated rounded-lg">
                            <span className="text-xs app-text-secondary block">Account Name</span>
                            <div className="flex items-center justify-between">
                              <span className="font-medium app-text-primary">{bankDetails.accountName}</span>
                              <button
                                onClick={() => copyToClipboard(bankDetails.accountName, "accountName")}
                                className="p-1 hover:bg-[var(--app-bg)] rounded"
                              >
                                {copiedField === "accountName" ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 app-text-secondary" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 app-elevated rounded-lg">
                            <span className="text-xs app-text-secondary block">Account Number</span>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-medium app-text-primary">{bankDetails.accountNumber}</span>
                              <button
                                onClick={() => copyToClipboard(bankDetails.accountNumber, "accountNumber")}
                                className="p-1 hover:bg-[var(--app-bg)] rounded"
                              >
                                {copiedField === "accountNumber" ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 app-text-secondary" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 app-elevated rounded-lg">
                            <span className="text-xs app-text-secondary block">IFSC Code</span>
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-medium app-text-primary">{bankDetails.ifscCode}</span>
                              <button
                                onClick={() => copyToClipboard(bankDetails.ifscCode, "ifscCode")}
                                className="p-1 hover:bg-[var(--app-bg)] rounded"
                              >
                                {copiedField === "ifscCode" ? (
                                  <Check className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4 app-text-secondary" />
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="p-3 app-elevated rounded-lg">
                            <span className="text-xs app-text-secondary block">Bank & Branch</span>
                            <span className="text-sm app-text-primary">HDFC Bank - {bankDetails.branch}</span>
                          </div>

                          <div className="p-3 app-elevated rounded-lg">
                            <span className="text-xs app-text-secondary block">GSTIN/UIN</span>
                            <span className="font-mono text-sm app-text-primary">{bankDetails.gstin}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {!selectedMethod && (
                  <p className="mt-6 text-center app-text-secondary text-sm">
                    Select a payment method above to continue
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
