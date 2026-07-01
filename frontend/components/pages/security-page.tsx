"use client";

import { useState } from "react";

const SESSIONS = [
  { device: 'MacBook Pro 16"', browser: "Chrome 126", location: "Mumbai, IN", lastActive: "Now (Current)", current: true },
  { device: "iPhone 15 Pro", browser: "Safari 17", location: "Mumbai, IN", lastActive: "2 hours ago", current: false },
  { device: "Windows PC", browser: "Chrome 125", location: "Delhi, IN", lastActive: "Yesterday", current: false },
];

export function SecurityPage() {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportConfirm, setExportConfirm] = useState(false);
  const [deleteText, setDeleteText] = useState("");

  return (
    <div className="p-7 flex flex-col gap-6">
      <div>
        <h2 className="font-syne text-base font-bold text-on-surface">Security</h2>
        <p className="text-xs text-on-surface-variant font-mono mt-0.5">Manage authentication, sessions and access controls</p>
      </div>

      <div className="glass-card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-syne font-bold text-on-surface text-sm">Two-Factor Authentication</h3>
            <p className="text-xs text-on-surface-variant mt-1">Adds an extra layer of security to your account</p>
          </div>
          <span className="badge-success">Enabled</span>
        </div>
        <div className="bg-surface-container-lowest rounded-lg p-4 border border-outline-variant">
          <div className="text-xs text-on-surface-variant font-mono">Method</div>
          <div className="text-sm text-on-surface mt-1">Authenticator App (Google Authenticator)</div>
        </div>
        <div className="flex gap-2">
          <button className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Manage 2FA</button>
          <button className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">View Backup Codes</button>
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-outline-variant">
          <div>
            <h3 className="font-syne font-bold text-on-surface text-sm">Active Sessions</h3>
            <p className="text-xs text-on-surface-variant mt-0.5">{SESSIONS.length} active sessions</p>
          </div>
          <button className="text-xs px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Revoke All Other Sessions</button>
        </div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-outline-variant">
              {["Device", "Browser", "Location", "Last Active", "Action"].map((h) => (
                <th key={h} className="text-left px-5 py-3 font-mono text-on-surface-variant font-normal uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SESSIONS.map((s, i) => (
              <tr key={i} className="border-b border-outline-variant last:border-0">
                <td className="px-5 py-3 text-on-surface">{s.device}</td>
                <td className="px-5 py-3 text-on-surface-variant font-mono">{s.browser}</td>
                <td className="px-5 py-3 text-on-surface-variant">{s.location}</td>
                <td className="px-5 py-3 text-on-surface-variant font-mono">
                  {s.current ? <span className="badge-success">Current</span> : s.lastActive}
                </td>
                <td className="px-5 py-3">
                  {!s.current && (
                    <button className="text-red-400 hover:text-red-300 transition-colors text-[11px]">Revoke</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-5 flex flex-col gap-4">
        <h3 className="font-syne font-bold text-on-surface text-sm">API Security</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest rounded-lg p-4 border border-outline-variant">
            <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1">Rate Limits</div>
            <div className="text-sm text-on-surface">100 requests / minute per workspace</div>
          </div>
          <div className="bg-surface-container-lowest rounded-lg p-4 border border-outline-variant">
            <div className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant mb-1">CORS Origins</div>
            <div className="text-sm text-on-surface font-mono">luxoroffice.com, app.luxoroffice.com</div>
          </div>
        </div>
        <button className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors w-fit">Manage API Settings</button>
      </div>

      <div className="glass-card p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="font-syne font-bold text-on-surface text-sm">Password</h3>
          <p className="text-xs text-on-surface-variant mt-1 font-mono">Last changed 45 days ago</p>
        </div>
        <button onClick={() => setShowPasswordModal(true)} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Change Password</button>
      </div>

      <div className="glass-card p-5 flex flex-col gap-4 border border-red-500/30">
        <div>
          <h3 className="font-syne font-bold text-red-400 text-sm">Danger Zone</h3>
          <p className="text-xs text-on-surface-variant mt-1">These actions are irreversible. Proceed with caution.</p>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-lg bg-surface-container-lowest border border-outline-variant">
            <div>
              <div className="text-sm text-on-surface font-medium">Export All Data (GDPR)</div>
              <div className="text-xs text-on-surface-variant mt-0.5">Download a full copy of your workspace data</div>
            </div>
            {!exportConfirm ? (
              <button onClick={() => setExportConfirm(true)} className="text-xs px-4 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Export Data</button>
            ) : (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-amber-400 font-mono">Are you sure?</span>
                <button onClick={() => setExportConfirm(false)} className="text-xs px-3 py-1.5 rounded border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors">Confirm Export</button>
                <button onClick={() => setExportConfirm(false)} className="text-xs text-on-surface-variant hover:text-on-surface">Cancel</button>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 p-4 rounded-lg bg-surface-container-lowest border border-red-500/20">
            <div>
              <div className="text-sm text-red-400 font-medium">Delete Workspace</div>
              <div className="text-xs text-on-surface-variant mt-0.5">Permanently delete all data. This cannot be undone.</div>
            </div>
            {!deleteConfirm ? (
              <button onClick={() => setDeleteConfirm(true)} className="text-xs px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">Delete Workspace</button>
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  className="input-base text-xs"
                  placeholder='Type "I understand the consequences" to confirm'
                  value={deleteText}
                  onChange={(e) => setDeleteText(e.target.value)}
                />
                <div className="flex gap-2">
                  <button disabled={deleteText !== "I understand the consequences"} className="text-xs px-4 py-1.5 rounded border border-red-500/50 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-40">Confirm Delete</button>
                  <button onClick={() => { setDeleteConfirm(false); setDeleteText(""); }} className="text-xs text-on-surface-variant hover:text-on-surface">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-card-high p-6 w-full max-w-md flex flex-col gap-4">
            <h3 className="font-syne font-bold text-on-surface">Change Password</h3>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Current Password</label>
                <input type="password" className="input-base" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">New Password</label>
                <input type="password" className="input-base" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant">Confirm New Password</label>
                <input type="password" className="input-base" />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="primary-gradient text-white text-xs font-semibold px-5 py-2 rounded-lg hover:opacity-90 transition-opacity">Update Password</button>
              <button onClick={() => setShowPasswordModal(false)} className="text-xs px-5 py-2 rounded-lg border border-outline-variant text-on-surface-variant hover:text-on-surface transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
