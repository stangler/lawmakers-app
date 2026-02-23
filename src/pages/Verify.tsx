/**
 * Verify Page
 * メール確認ページ
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthProvider';

export function Verify(): React.ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async (): Promise<void> => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      // URLパラメータにエラーがある場合
      if (error) {
        setStatus('error');
        switch (error) {
          case 'invalid_token':
            setErrorMessage('トークンが無効または期限切れです');
            break;
          case 'user_not_found':
            setErrorMessage('ユーザーが見つかりません');
            break;
          case 'server_error':
            setErrorMessage('サーバーエラーが発生しました');
            break;
          default:
            setErrorMessage('エラーが発生しました');
        }
        return;
      }

      // トークンがない場合
      if (!token) {
        setStatus('error');
        setErrorMessage('トークンが指定されていません');
        return;
      }

      try {
        // 確認 API を呼び出し（リダイレクトされるはず）
        const response = await fetch(`/api/verify?token=${encodeURIComponent(token)}`, {
          method: 'GET',
          credentials: 'include',
          redirect: 'manual', // 手動でリダイレクトを処理
        });

        // リダイレクトの場合（302）
        if (response.type === 'opaqueredirect' || response.status === 0) {
          // リダイレクト先を取得できないため、ユーザー情報を更新してホームへ
          await refreshUser();
          setStatus('success');
          setTimeout(() => {
            navigate('/');
          }, 2000);
          return;
        }

        // 成功レスポンス（JSON）
        if (response.ok) {
          setStatus('success');
          await refreshUser();
          setTimeout(() => {
            navigate('/');
          }, 2000);
          return;
        }

        // エラーレスポンス
        const data = await response.json();
        setStatus('error');
        setErrorMessage(data.error || '確認に失敗しました');
      } catch (err) {
        console.error('Verify error:', err);
        setStatus('error');
        setErrorMessage('ネットワークエラーが発生しました');
      }
    };

    void verifyEmail();
  }, [searchParams, navigate, refreshUser]);

  // ローディング状態
  if (status === 'loading') {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50' },
      React.createElement('div', { className: 'text-center' },
        React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto' }),
        React.createElement('p', { className: 'mt-4 text-gray-600' }, 'メールアドレスを確認中...')
      )
    );
  }

  // 成功状態
  if (status === 'success') {
    return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50' },
      React.createElement('div', { className: 'max-w-md w-full text-center' },
        React.createElement('div', { className: 'rounded-full h-16 w-16 bg-green-100 flex items-center justify-center mx-auto' },
          React.createElement('svg', { className: 'h-8 w-8 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
            React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M5 13l4 4L19 7' })
          )
        ),
        React.createElement('h2', { className: 'mt-4 text-2xl font-bold text-gray-900' }, 'メール確認完了'),
        React.createElement('p', { className: 'mt-2 text-gray-600' }, 'アカウントが有効化されました'),
        React.createElement('p', { className: 'mt-4 text-sm text-gray-500' }, 'ホームページに移動します...')
      )
    );
  }

  // エラー状態
  return React.createElement('div', { className: 'min-h-screen flex items-center justify-center bg-gray-50' },
    React.createElement('div', { className: 'max-w-md w-full text-center' },
      React.createElement('div', { className: 'rounded-full h-16 w-16 bg-red-100 flex items-center justify-center mx-auto' },
        React.createElement('svg', { className: 'h-8 w-8 text-red-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
          React.createElement('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M6 18L18 6M6 6l12 12' })
        )
      ),
      React.createElement('h2', { className: 'mt-4 text-2xl font-bold text-gray-900' }, '確認エラー'),
      React.createElement('p', { className: 'mt-2 text-gray-600' }, errorMessage),
      React.createElement('div', { className: 'mt-6' },
        React.createElement('button', {
          onClick: () => navigate('/login'),
          className: 'text-blue-600 hover:text-blue-500'
        }, 'ログイン画面へ')
      )
    )
  );
}