
import React from "react";

interface TemplateColorPickerProps {
  colors: string[];
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const COLOR_NAMES: Record<string, string> = {
  "#a4814c": "Brown",
  "#18bc6b": "Green",
  "#2196F3": "Blue",
  "#ff1e1e": "Red",
  "#000": "Black",
};

const TemplateColorPicker: React.FC<TemplateColorPickerProps> = ({
  colors,
  selectedColor,
  onColorSelect,
}) => {
  return (
    <div className="flex gap-4 py-3 justify-center">
      {colors.map((color) => (
        <button
          key={color}
          aria-label={COLOR_NAMES[color] || color}
          type="button"
          className={`rounded-full w-7 h-7 flex items-center justify-center border-2 transition-all 
            ${selectedColor === color
              ? "border-[4px] border-[rgba(164,129,76,0.8)]"
              : "border-gray-300"
            }`}
          style={{ backgroundColor: color === "#fff" ? "#fff" : color }}
          onClick={e => { e.stopPropagation(); onColorSelect(color); }}
        >
          {selectedColor === color && color === "#fff" && (
            <span className="block w-4 h-4 bg-white rounded-full" />
          )}
        </button>
      ))}
    </div>
  );
};

export default TemplateColorPicker;
