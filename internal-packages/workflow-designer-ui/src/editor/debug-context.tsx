import { createContext, useContext, useState, ReactNode } from 'react';

// デバッグ状態の型
export type GitHubAuthDebugState = 'default' | 'unauthorized' | 'not-installed' | 'installed';

// デバッグコンテキストの型
type DebugContextType = {
  githubAuthState: GitHubAuthDebugState;
  setGithubAuthState: (state: GitHubAuthDebugState) => void;
};

// デフォルト値
const defaultContext: DebugContextType = {
  githubAuthState: 'default',
  setGithubAuthState: () => {},
};

// コンテキスト作成
const DebugContext = createContext<DebugContextType>(defaultContext);

// useDebugフック
export const useDebug = () => useContext(DebugContext);

// Props型
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