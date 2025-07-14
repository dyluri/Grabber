import React from 'react';
import download from './download.jpg';
const UpdateButton = ({ onClick }: { onClick: () => void }) => {
  const buttonStyle: React.CSSProperties = {
    background: 'linear-gradient(to bottom, #c6ffc9ff, #28b34bff)',
    border: '1px solid #33ff77ff',
    borderRadius: '12px',
    color: '#006611ff',
    fontWeight: 'bold',
    fontSize: '16px',
    boxShadow: 'inset 0 1px 0 #ffffff, 0 3px 6px rgba(0, 0, 0, 0.3)',
    textShadow: '0 1px 0 #ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  };

  const hoverStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'linear-gradient(to bottom, #daffd7ff, #a2ff99ff)',
    transform: 'translateY(-1px)',
  };

  const [hover, setHover] = React.useState(false);

  return (
    <button
      style={hover ? hoverStyle : buttonStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
    >
      <img src={download} style={{ width: '80%' }} />
    </button>
  );
};

export default UpdateButton;
