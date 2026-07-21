'use client';

interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface SelectProps<T extends string> {
  id: string;
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  className?: string;
}

export function Select<T extends string>({
  id,
  label,
  value,
  onChange,
  options,
  className,
}: SelectProps<T>) {
  return (
    <div className={`flex flex-col gap-2 ${className ?? ''}`}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full md:w-48 border-2 border-gray-300 rounded-lg px-4 py-2 bg-white text-gray-900 cursor-pointer focus:outline-none focus:border-blue-500 transition-colors duration-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
