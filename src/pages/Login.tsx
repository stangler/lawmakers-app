/**
 * Login Page
 * ログインフォーム
 */

import React, { useState } from 'react';
import { useAuth } from '../components/AuthProvider';

interface LoginProps {
  onSwitchToSignup?: () => void;
  onSuccess?: () => void;
}

export function Login({ onSwitchToSignup, onSuccess }: LoginProps): React.ReactElement {
  const { login } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    // バリデーション
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }

    setIsLoading(true);

    const result = await login(email, password);

    setIsLoading(false);

    if (result.success) {
      onSuccess?.();
    } else {
      setError(result.error || 'ログインに失敗しました');
    }
  };

  return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8' },
    React.createElement('div', { className: 'max-w-md w-full space-y-8' },
      React.createElement('div', null,
        React.createElement('h2', { className: 'mt-6 text-center text-3xl font-extrabold text-gray-900' },
          'ログイン'
        ),
        React.createElement('p', { className: 'mt-2 text-center text-sm text-gray-600' },
          'Lawmakers App にログインしてください'
        )
      ),
      React.createElement('form', { className: 'mt-8 space-y-6', onSubmit: handleSubmit },
        error && React.createElement('div', { className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded' },
          error
        ),
        React.createElement('div', { className: 'rounded-md shadow-sm -space-y-px' },
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'email', className: 'sr-only' }, 'メールアドレス'),
            React.createElement('input', {
              id: 'email',
              name: 'email',
              type: 'email',
              autoComplete: 'email',
              required: true,
              value: email,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value),
              className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
              placeholder: 'メールアドレス'
            })
          ),
          React.createElement('div', null,
            React.createElement('label', { htmlFor: 'password', className: 'sr-only' }, 'パスワード'),
            React.createElement('input', {
              id: 'password',
              name: 'password',
              type: 'password',
              autoComplete: 'current-password',
              required: true,
              value: password,
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value),
              className: 'appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm',
              placeholder: 'パスワード'
            })
          )
        ),
        React.createElement('div', null,
          React.createElement('button', {
            type: 'submit',
            disabled: isLoading,
            className: 'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          },
            isLoading ? 'ログイン中...' : 'ログイン'
          )
        ),
        onSwitchToSignup && React.createElement('div', { className: 'text-center' },
          React.createElement('button', {
            type: 'button',
            onClick: onSwitchToSignup,
            className: 'text-blue-600 hover:text-blue-500'
          }, 'アカウントをお持ちでないですか？ 新規登録')
        )
      )
    )
  );
}