
import React from "react";
import "./TemplateColorPicker.css";

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
    <div className="template-color-picker">
      {colors.map((color) => (
        <button
          key={color}
          aria-label={COLOR_NAMES[color] || color}
          type="button"
          className={`color-picker-button ${
            selectedColor === color
              ? "color-picker-button--selected"
              : "color-picker-button--unselected"
          }`}
          style={{ "--button-color": color === "#fff" ? "#fff" : color } as React.CSSProperties}
          onClick={e => { e.stopPropagation(); onColorSelect(color); }}
        >
          {selectedColor === color && color === "#fff" && (
            <span className="white-color-indicator" />
          )}
        </button>
      ))}
    </div>
  );
};

export default TemplateColorPicker;
