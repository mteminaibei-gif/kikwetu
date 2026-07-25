'use client';

import PostComposer from './PostComposer';

/** Legacy import path — always renders the inline composer (no modal). */
export default function CreatePostModal(_props?: { onClose?: () => void }) {
  return <PostComposer />;
}
