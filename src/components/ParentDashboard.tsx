'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { createClient } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { Profile, Professional } from '@/types';

export default function ParentDashboard() {
  const { user, updateProfile } = useAuth();
  const { show } = useToast();
  const [sb] = useState(() => createClient());
  const [children, setChildren] = useState<{ child_name: string; child_age?: number; child_grade?: string }[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [childGrade, setChildGrade] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [pRes, linkRes] = await Promise.all([
        sb.from('professionals').select('*, profile:profiles(full_name, avatar_url, county, verified, heshima_score, role)').eq('verification_status', 'approved'),
        sb.from('parent_links').select('*').eq('parent_id', user.id).maybeSingle(),
      ]);
      if (pRes.data) setProfessionals(pRes.data as Professional[]);
      if (linkRes.data) {
        setChildren(linkRes.data.children || []);
        setApprovedIds(linkRes.data.approved_professional_ids || []);
      }
      setLoading(false);
    };
    load();
  }, [user, sb]);

  const saveParentLink = async (updatedChildren: typeof children, updatedApproved: string[]) => {
    if (!user) return;
    const { error } = await sb.from('parent_links').upsert({
      parent_id: user.id,
      children: updatedChildren,
      approved_professional_ids: updatedApproved,
    }).select().single();
    if (error) { show(error.message); return; }
    show('Saved!');
  };

  const addChild = () => {
    if (!childName.trim()) { show('Child name is required.'); return; }
    const newChildren = [...children, { child_name: childName.trim(), child_age: childAge ? parseInt(childAge) : undefined, child_grade: childGrade || undefined }];
    setChildren(newChildren);
    saveParentLink(newChildren, approvedIds);
    setChildName('');
    setChildAge('');
    setChildGrade('');
  };

  const removeChild = (idx: number) => {
    const newChildren = children.filter((_, i) => i !== idx);
    setChildren(newChildren);
    saveParentLink(newChildren, approvedIds);
  };

  const toggleProfessional = (profId: string) => {
    const newApproved = approvedIds.includes(profId)
      ? approvedIds.filter(id => id !== profId)
      : [...approvedIds, profId];
    setApprovedIds(newApproved);
    saveParentLink(children, newApproved);
  };

  const becomeParent = async () => {
    const { error } = await updateProfile({ role: 'parent' });
    if (!error) show('You are now registered as a Mzazi (Parent)!');
  };

  if (!user) return <div className="text-center py-12 text-gray-400">Please sign in first.</div>;

  const isParent = user.role === 'parent';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div className="sun-card p-8">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-5xl">👨‍👩‍👧‍👦</span>
          <div>
            <h1 className="text-2xl font-black">Mzazi Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your children&apos;s learning and approve trusted professionals</p>
          </div>
        </div>

        {!isParent && (
          <div className="p-4 rounded-xl bg-brand-terracotta/5 border border-brand-terracotta/20 space-y-3">
            <p className="text-sm font-medium">Register as a parent to manage children and approve their teachers.</p>
            <button onClick={becomeParent} className="sun-btn px-6 py-2.5 rounded-full text-xs font-bold shadow-md">
              Register as Mzazi
            </button>
          </div>
        )}

        {isParent && (
          <>
            <div className="space-y-4 mt-6">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
                My Children / Students
              </h3>

              {children.length > 0 && (
                <div className="space-y-2">
                  {children.map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-sm font-bold">{c.child_name}</p>
                        <p className="text-xs text-gray-400">
                          {c.child_age && `Age ${c.child_age}`}
                          {c.child_grade && ` · Grade ${c.child_grade}`}
                        </p>
                      </div>
                      <button onClick={() => removeChild(i)}
                        className="text-xs text-red-500 hover:text-red-700 font-bold px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <input value={childName} onChange={e => setChildName(e.target.value)}
                  placeholder="Child's name" maxLength={100}
                  className="flex-1 min-w-[140px] p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                <input value={childAge} onChange={e => setChildAge(e.target.value)}
                  placeholder="Age" type="number" min={1} max={25}
                  className="w-20 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                <input value={childGrade} onChange={e => setChildGrade(e.target.value)}
                  placeholder="Grade" maxLength={20}
                  className="w-24 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
                <button onClick={addChild}
                  className="px-4 py-2.5 bg-brand-deep text-white rounded-xl text-xs font-bold hover:bg-brand-deep/90 transition-colors active:scale-95">
                  Add Child
                </button>
              </div>
            </div>

            <div className="space-y-4 mt-8">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <svg className="w-4 h-4 text-brand-red" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                Approved Professionals
              </h3>
              <p className="text-xs text-gray-400">Only approved professionals can interact with your children.</p>

              {loading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {professionals.map(p => (
                    <div key={p.id}
                      className={cn(
                        'p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.98]',
                        approvedIds.includes(p.profile_id)
                          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      )}
                      onClick={() => toggleProfessional(p.profile_id)}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-red flex items-center justify-center text-sm font-bold text-white">
                          {p.profile?.full_name?.[0] || 'P'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold truncate">{p.profile?.full_name || 'Professional'}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{p.title}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${approvedIds.includes(p.profile_id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                          {approvedIds.includes(p.profile_id) && (
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {professionals.length === 0 && (
                    <p className="col-span-full text-xs text-gray-400 text-center py-4">No verified professionals yet.</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
