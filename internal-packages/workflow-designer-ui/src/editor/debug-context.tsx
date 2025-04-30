import { createContext, useContext, useState, ReactNode } from 'react';

// デバッグ状態の型
export type GitHubAuthDebugState = 'default' | 'unauthorized' | 'not-installed' | 'installed';

// デバッグコンテキストの型
interface DebugContextType {
  githubAuthState: GitHubAuthDebugState;
  setGithubAuthState: (state: GitHubAuthDebugState) => void;
}

// デフォルト値でコンテキストを作成
const DebugContext = createContext<DebugContextType>({
  githubAuthState: 'default',
  setGithubAuthState: () => {},
});

// コンテキストプロバイダーのPropsの型
interface DebugProviderProps {
  children: ReactNode;
}

// デバッグコンテキストプロバイダーコンポーネント
export function DebugProvider({ children }: DebugProviderProps) {
  const [githubAuthState, setGithubAuthState] = useState<GitHubAuthDebugState>('default');

  const value = {
    githubAuthState,
    setGithubAuthState,
  };

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  );
}

// デバッグコンテキストを使用するためのフック
export function useDebug() {
  return useContext(DebugContext);
} 