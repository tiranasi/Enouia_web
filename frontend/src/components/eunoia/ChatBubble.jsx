import React from 'react';

export default function ChatBubble({ message, isUser, isFirst, userAvatar, userName, aiAvatar, styleName }) {
  return (
    <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden">
        {isUser ? (
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center text-white font-medium">
            {userAvatar?.startsWith('http') ? (
              <img src={userAvatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base">{userAvatar || '😊'}</span>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium">
            {aiAvatar?.startsWith('http') ? (
              <img src={aiAvatar} alt="AI" className="w-full h-full object-cover" />
            ) : (
              <span className="text-base">{aiAvatar || '🤗'}</span>
            )}
          </div>
        )}
      </div>

      {/* Message Content */}
      <div className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        {isFirst && !isUser && styleName && (
          <p className="text-xs text-gray-500 mb-1 px-2">使用 <strong>{styleName}</strong></p>
        )}
        {isUser && userName && (
          <p className="text-xs text-gray-500 mb-1 px-2">{userName}</p>
        )}
        <div 
          className={`px-4 py-3 rounded-[18px] ${
            isUser 
              ? 'bg-gray-100 text-gray-900 rounded-br-md' 
              : 'bg-teal-500 text-white rounded-bl-md'
          } shadow-sm`}
        >
          <p className="text-sm leading-relaxed">{message}</p>
        </div>
      </div>
    </div>
  );
}