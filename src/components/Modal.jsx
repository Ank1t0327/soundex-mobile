import React from 'react';

function Modal({ 
  title, 
  data, 
  isHistory,
  onClose, 
  onSelect, 
  onRemove, 
  onClearHistory 
}) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{title.toUpperCase()}</h2>
        </div>

        <div className="modal-content">
          {data.length === 0 ? (
            <div className="modal-empty">This list is empty.</div>
          ) : (
            data.map((item, index) => (
              <div key={index} className="modal-item">
                <div
                  className="modal-item-title"
                  onClick={() => onSelect(item)}
                >
                  {item.t} {item.y && `(${item.y})`}
                </div>
                <button
                  className="modal-item-delete"
                  onClick={() => onRemove(item.id, isHistory)}
                >
                  [X]
                </button>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer">
          {isHistory && onClearHistory && (
            <button className="btn-clear" onClick={onClearHistory}>
              CLEAR ALL
            </button>
          )}
          <button className="btn-close" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export default Modal;
