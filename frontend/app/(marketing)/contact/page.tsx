"use client";

import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";

const gmvRanges = [
  "Less than 10L/month",
  "10L - 50L/month",
  "50L - 1Cr/month",
  "1Cr - 5Cr/month",
  "5Cr+/month",
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    gmv: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full badge-primary text-xs font-medium mb-6">
            Contact
          </div>
          <h1 className="text-5xl font-bold text-on-surface mb-4">
            Let us talk growth
          </h1>
          <p className="text-lg text-on-surface-variant max-w-xl mx-auto">
            Book a personalized demo or send us a message. Our team responds within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <div className="space-y-4 mb-8">
              {[
                { icon: "mail", label: "Email us", value: "hello@growthos.in" },
                { icon: "phone", label: "Call us", value: "+91 98765 43210" },
                { icon: "schedule", label: "Working hours", value: "Mon-Fri, 9am - 6pm IST" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4 glass-card rounded-xl p-4">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(192,193,255,0.1)] flex items-center justify-center shrink-0">
                    <AppIcon name={item.icon} className="text-primary" size={17} />
                  </div>
                  <div>
                    <p className="text-xs text-on-surface-variant">{item.label}</p>
                    <p className="text-sm font-medium text-on-surface">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {submitted ? (
              <div className="glass-card-high rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-[rgba(74,222,128,0.12)] flex items-center justify-center mx-auto mb-4">
                  <AppIcon name="check_circle" className="text-success-accent" size={25} />
                </div>
                <h3 className="text-lg font-semibold text-on-surface mb-2">Message sent!</h3>
                <p className="text-sm text-on-surface-variant">
                  Thank you for reaching out. Our team will get back to you within 24 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-6 space-y-4">
                <h3 className="text-lg font-semibold text-on-surface mb-2">Send a message</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1.5">Full name</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      placeholder="Arjun Kapoor"
                      className="w-full input-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-on-surface-variant mb-1.5">Work email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="arjun@yourbrand.com"
                      className="w-full input-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5">Brand / Company</label>
                  <input
                    type="text"
                    name="company"
                    value={form.company}
                    onChange={handleChange}
                    required
                    placeholder="Urban Thread Co"
                    className="w-full input-base"
                  />
                </div>

                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5">Monthly GMV</label>
                  <select
                    name="gmv"
                    value={form.gmv}
                    onChange={handleChange}
                    required
                    className="w-full input-base"
                  >
                    <option value="" disabled>Select your GMV range</option>
                    {gmvRanges.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-on-surface-variant mb-1.5">Message</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Tell us about your brand and what you are looking to solve..."
                    className="w-full input-base resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white primary-gradient hover:opacity-90 transition-all"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          <div>
            <div className="glass-card-high rounded-2xl overflow-hidden h-full min-h-[600px] flex flex-col">
              <div className="p-6 border-b border-[rgba(70,69,84,0.3)]">
                <h3 className="text-lg font-semibold text-on-surface mb-1">Book a Demo</h3>
                <p className="text-sm text-on-surface-variant">
                  Schedule a 30-minute personalized walkthrough with our team.
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[rgba(192,193,255,0.1)] flex items-center justify-center mx-auto mb-4">
                    <AppIcon name="calendar_month" className="text-primary" size={28} />
                  </div>
                  <p className="text-sm font-medium text-on-surface mb-2">Schedule via Calendly</p>
                  <p className="text-xs text-on-surface-variant mb-6 max-w-xs mx-auto">
                    Pick a time that works for you. Our product team will walk you through GrowthOS live.
                  </p>
                  <a
                    href="https://calendly.com/growthos/demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-6 py-3 text-sm font-semibold text-white rounded-xl primary-gradient hover:opacity-90 transition-all"
                  >
                    Open Scheduling Link
                  </a>
                  <div className="mt-8 grid grid-cols-1 gap-3 text-left">
                    {[
                      { icon: "timer", text: "30-minute session" },
                      { icon: "videocam", text: "Google Meet or Zoom" },
                      { icon: "person", text: "With a product specialist" },
                      { icon: "check_circle", text: "No sales pressure" },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <AppIcon name={item.icon} className="text-primary" size={17} />
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
