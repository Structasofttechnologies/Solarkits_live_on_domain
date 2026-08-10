// src/pages/technician-app/TechnicianAppPage.jsx
import { useState } from 'react';
import { Wrench, MapPin, Camera, CheckCircle2, Clock, Navigation, Phone, Upload } from 'lucide-react';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { visits } from '../../mocks/data';
import { toast } from '../../hooks';

export default function TechnicianAppPage() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [activeJob, setActiveJob] = useState(visits[0]);
  const [completedItems, setCompletedItems] = useState([0, 1]);

  const checklist = [
    'Confirm safety gear (PPE) and harness',
    'Visual check of solar array & glass condition',
    'Panel cleaning / dust removal',
    'Measure string voltages & currents',
    'Test inverter output and error logs',
    'Take site photo and customer signature',
  ];

  const toggleCheck = (idx) => {
    setCompletedItems(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  };

  const handleCheckIn = () => {
    setCheckedIn(true);
    toast.success('GPS Check-In Successful! Location recorded.');
  };

  const handleCompleteJob = () => {
    toast.success('Job marked as completed! Work order submitted.');
    setCheckedIn(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center py-6 px-4">
      {/* Mobile Frame */}
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-navy flex flex-col h-[750px]">
        {/* Mobile Header */}
        <div className="bg-navy text-white px-5 py-4 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xxs font-mono text-solar font-bold">EMERGESUN FIELD SERVICE</span>
            <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
          </div>
          <p className="font-bold text-base">Technician Mobile Portal</p>
          <p className="text-xs text-navy-300">Logged in as: <strong>Suresh Patel</strong></p>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Job Header */}
          <div className="bg-solar/10 border border-solar/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xxs font-bold uppercase tracking-wider text-solar-dark">Current Job</span>
              <Badge status={activeJob.status} size="xs" />
            </div>
            <h3 className="font-bold text-navy text-base">{activeJob.customerName}</h3>
            <p className="text-xs text-text-secondary">{activeJob.siteName}</p>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-solar/20 text-xs text-text-secondary">
              <MapPin size={14} className="text-solar shrink-0" />
              <span className="truncate">{activeJob.location}</span>
            </div>
          </div>

          {/* Action: GPS Check-in */}
          {!checkedIn ? (
            <div className="card p-4 text-center space-y-3">
              <p className="text-xs text-text-secondary">You have arrived at the site. Please check in with GPS location.</p>
              <Button fullWidth onClick={handleCheckIn} leftIcon={<Navigation size={15} />}>
                GPS Check-In at Site
              </Button>
            </div>
          ) : (
            <div className="bg-success-50 border border-success/30 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success" />
                <span className="text-xs font-semibold text-success-700">Checked In (23.0225° N, 72.5714° E)</span>
              </div>
            </div>
          )}

          {/* Service Checklist */}
          {checkedIn && (
            <div className="card p-4 space-y-3">
              <h4 className="font-bold text-navy text-sm flex items-center justify-between">
                <span>Digital Maintenance Checklist</span>
                <span className="text-xs text-solar font-semibold">{completedItems.length} / {checklist.length}</span>
              </h4>

              <div className="space-y-2">
                {checklist.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => toggleCheck(idx)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      completedItems.includes(idx) ? 'bg-success-50/50 border-success/30' : 'bg-gray-50 border-border'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                      completedItems.includes(idx) ? 'bg-success border-success text-white' : 'border-gray-300'
                    }`}>
                      {completedItems.includes(idx) && <CheckCircle2 size={13} />}
                    </div>
                    <span className={`text-xs ${completedItems.includes(idx) ? 'line-through text-text-muted' : 'text-navy font-medium'}`}>
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Photo Upload */}
              <div className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-solar">
                <Camera size={20} className="mx-auto text-text-muted mb-1" />
                <p className="text-xs text-text-secondary font-medium">Attach Site Inspection Photo</p>
              </div>

              <Button
                fullWidth
                variant="success"
                disabled={completedItems.length < checklist.length}
                onClick={handleCompleteJob}
              >
                Complete Job & Submit
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Footer Bar */}
        <div className="bg-white border-t border-border px-4 py-3 flex justify-around text-center text-xxs font-medium text-text-secondary shrink-0">
          <button className="text-solar font-bold">● Active Job</button>
          <button onClick={() => window.location.href = '/dashboard'}>● Exit Mobile App</button>
        </div>
      </div>
    </div>
  );
}
