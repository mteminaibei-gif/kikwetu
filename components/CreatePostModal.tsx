'use client';

import React, { useState } from 'react';
import { X, Image, Mic, BarChart3, Type } from 'lucide-react';
import { Button } from './ui/Button';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type PostType = 'question' | 'answer' | 'multiChoice' | 'poll';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ isOpen, onClose }) => {
  const [postType, setPostType] = useState<PostType>('question');
  const [content, setContent] = useState('');
  const [selectedSpace, setSelectedSpace] = useState('General Baraza');

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4">
        <div className="w-full max-w-2xl bg-bg-primary rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-bg-primary border-b border-border-light px-4 py-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary">Create Post</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-secondary rounded-lg transition text-text-secondary"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 md:p-6">
            {/* Rich Text Editor */}
            <textarea
              placeholder="Share knowledge, ask a question, or start a Mjadala (debate)..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-bg-secondary border border-border-light rounded-lg p-4 text-text-primary placeholder-text-tertiary focus:outline-none focus:border-kikwetu-orange resize-none mb-4"
              rows={4}
            />

            {/* Formatting & Media Toolbar */}
            <div className="flex items-center justify-between gap-2 mb-6 pb-4 border-b border-border-light">
              <div className="flex gap-2">
                <button className="p-2 hover:bg-bg-secondary rounded-lg transition text-text-secondary hover:text-kikwetu-orange" aria-label="Text formatting">
                  <Type className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-bg-secondary rounded-lg transition text-text-secondary hover:text-kikwetu-orange" aria-label="Add image">
                  <Image className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-bg-secondary rounded-lg transition text-text-secondary hover:text-kikwetu-orange" aria-label="Add voice">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="p-2 hover:bg-bg-secondary rounded-lg transition text-text-secondary hover:text-kikwetu-orange" aria-label="Add poll/quiz">
                  <BarChart3 className="w-5 h-5" />
                </button>
              </div>
              <div className="text-xs text-text-tertiary">
                {content.length}/5000
              </div>
            </div>

            {/* Post Type Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-3">
                Question or question
              </label>
              <div className="space-y-2">
                {[
                  { id: 'question', label: 'Question', icon: '❓' },
                  { id: 'multiChoice', label: 'Multiple Choice', icon: '📋' },
                  { id: 'multiChoice2', label: 'Multiple Choice', icon: '📋' },
                ].map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-3 p-3 border border-border-light rounded-lg hover:bg-bg-secondary cursor-pointer transition"
                  >
                    <input
                      type="radio"
                      name="postType"
                      value={option.id}
                      checked={postType === option.id}
                      onChange={(e) => setPostType(e.target.value as PostType)}
                      className="w-4 h-4"
                    />
                    <span className="text-lg">{option.icon}</span>
                    <span className="text-text-primary">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Space Selector */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-text-primary mb-2">
                Space (Community) to post in
              </label>
              <select
                value={selectedSpace}
                onChange={(e) => setSelectedSpace(e.target.value)}
                className="w-full bg-bg-secondary border border-border-light rounded-lg px-3 py-2 text-text-primary focus:outline-none focus:border-kikwetu-orange"
              >
                <option>General Baraza</option>
                <option>Kilimo Tech</option>
                <option>Nairobi Startups</option>
                <option>Sheng Culture</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="ghost"
                fullWidth
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                fullWidth
                disabled={content.trim().length === 0}
              >
                Post
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePostModal;
