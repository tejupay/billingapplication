import React from 'react';
import { useData } from '../../context/DataContext';
import { X, ShieldAlert, Clock, User, FileText } from 'lucide-react';

export const AuditLogsModal = ({ isOpen, onClose }) => {
  const { auditLogs } = useData();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center text-purple-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-heading text-white">System Security & Audit Logs</h3>
              <p className="text-xs text-slate-400">Owner security compliance & event audit trail</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 bg-slate-800 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-3">
          {auditLogs.map(log => (
            <div key={log.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-400"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[10px]">
                      {log.action}
                    </span>
                    <span className="text-slate-300 font-medium">{log.details}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    User: <span className="text-slate-400 font-semibold">{log.username}</span> ({log.role})
                  </div>
                </div>
              </div>

              <div className="text-right text-[10px] font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> {log.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
