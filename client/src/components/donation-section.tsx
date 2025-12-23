import { useState } from "react";
import { Heart, CreditCard, Smartphone, Building2, Copy, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import upiQrCode from "@/assets/upi-qr-code.png";

export function DonationSection() {
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
          <div className="px-6 py-4 border-b border-[var(--app-border)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold app-text-primary">Support Our Mission</h3>
                <p className="text-sm app-text-secondary">Help us continue building free music education tools</p>
              </div>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="pt-6">
              <p className="app-text-secondary mb-6 text-center max-w-2xl mx-auto">
                Your donation helps Nathaniel School of Music create free educational resources 
                and develop innovative tools for music students worldwide. Every contribution makes a difference!
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-xl border-2 border-[var(--app-border)] app-bg">
                  <div className="flex items-center gap-3 mb-4">
                    <CreditCard className="w-6 h-6 text-blue-500" />
                    <span className="font-semibold app-text-primary text-lg">PayPal</span>
                  </div>
                  <p className="text-sm app-text-secondary mb-4">
                    Secure international payments via PayPal
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm app-text-secondary mb-2">Enter Amount (USD)</label>
                      <div className="flex items-center gap-2">
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

                    <p className="text-xs app-text-secondary text-center">
                      Secure payment processed by PayPal
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-xl border-2 border-[var(--app-border)] app-bg">
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-6 h-6 text-green-500" />
                    <span className="font-semibold app-text-primary text-lg">UPI / Bank Transfer</span>
                    <span className="text-xs px-2 py-1 bg-green-500/20 text-green-600 rounded-full">India</span>
                  </div>
                  <p className="text-sm app-text-secondary mb-4">
                    For Indian students - Pay via UPI or direct bank transfer
                  </p>

                  <div className="text-center mb-4">
                    <div className="inline-block p-3 bg-white rounded-xl shadow-lg">
                      <img 
                        src={upiQrCode} 
                        alt="UPI QR Code - Jason Zachariah" 
                        className="w-32 h-32 object-contain"
                      />
                    </div>
                    <p className="mt-2 text-xs app-text-secondary">
                      Scan with any UPI app
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <code className="px-2 py-1 app-elevated rounded text-xs font-mono app-text-primary">
                        {bankDetails.upiId}
                      </code>
                      <button
                        onClick={() => copyToClipboard(bankDetails.upiId, "upiId")}
                        className="p-1 hover:bg-[var(--app-elevated)] rounded"
                      >
                        {copiedField === "upiId" ? (
                          <Check className="w-3 h-3 text-green-500" />
                        ) : (
                          <Copy className="w-3 h-3 app-text-secondary" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between p-2 app-elevated rounded">
                      <span className="app-text-secondary">A/C:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono app-text-primary">{bankDetails.accountNumber}</span>
                        <button onClick={() => copyToClipboard(bankDetails.accountNumber, "acc")} className="p-1">
                          {copiedField === "acc" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 app-text-secondary" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-2 app-elevated rounded">
                      <span className="app-text-secondary">IFSC:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono app-text-primary">{bankDetails.ifscCode}</span>
                        <button onClick={() => copyToClipboard(bankDetails.ifscCode, "ifsc")} className="p-1">
                          {copiedField === "ifsc" ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 app-text-secondary" />}
                        </button>
                      </div>
                    </div>
                    <p className="text-xs app-text-secondary text-center pt-2">
                      HDFC Bank - {bankDetails.branch}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
