import { useState, useEffect, useRef } from 'react';

interface SecureNotepadProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const SecureNotepad: React.FC<SecureNotepadProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  readOnly = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Disable context menu (right-click) and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (textareaRef.current && textareaRef.current.contains(e.target as Node)) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if textarea is focused
      if (document.activeElement === textareaRef.current) {
        // Prevent copy (Ctrl+C, Command+C)
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          e.preventDefault();
        }
        
        // Prevent cut (Ctrl+X, Command+X)
        if ((e.ctrlKey || e.metaKey) && e.key === 'x') {
          e.preventDefault();
        }
        
        // Prevent paste (Ctrl+V, Command+V)
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
        }
      }
    };

    // Add event listeners
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    // Clean up event listeners
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Log tab/window switches in a real application
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // In a real application, you would log this event
        console.log('User switched tabs or minimized window');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`relative border rounded-md ${isFocused ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300'}`}>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full px-3 py-2 min-h-[200px] rounded-md focus:outline-none resize-y ${
          readOnly ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
        }`}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
      />
      <div className="absolute bottom-2 right-2 text-xs text-gray-400">
        {value.length} characters
      </div>
    </div>
  );
};

export default SecureNotepad;