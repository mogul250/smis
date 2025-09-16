import React from 'react';

const Table = ({ 
  children, 
  className = '',
  striped = false,
  hover = true,
  ...props 
}) => {
  const baseClasses = 'min-w-full divide-y divide-gray-200';
  const containerClasses = 'overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg';

  return (
    <div className={containerClasses}>
      <table 
        className={`${baseClasses} ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

const TableHeader = ({ children, className = '', ...props }) => (
  <thead className={`bg-gray-50 ${className}`} {...props}>
    {children}
  </thead>
);

const TableBody = ({ children, className = '', striped = false, hover = true, ...props }) => {
  const bodyClasses = `bg-white divide-y divide-gray-200 ${className}`;
  
  return (
    <tbody className={bodyClasses} {...props}>
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          const rowClasses = [
            striped && index % 2 === 1 ? 'bg-gray-50' : '',
            hover ? 'hover:bg-gray-50' : '',
            child.props.className || ''
          ].filter(Boolean).join(' ');

          return React.cloneElement(child, {
            className: rowClasses
          });
        }
        return child;
      })}
    </tbody>
  );
};

const TableRow = ({ children, className = '', ...props }) => (
  <tr className={`transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

const TableHead = ({ children, className = '', sortable = false, ...props }) => {
  const headClasses = `px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
    sortable ? 'cursor-pointer hover:text-gray-700' : ''
  } ${className}`;

  return (
    <th 
      className={headClasses}
      scope="col"
      {...props}
    >
      {children}
    </th>
  );
};

const TableCell = ({ children, className = '', ...props }) => (
  <td 
    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
    {...props}
  >
    {children}
  </td>
);

Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHead;
Table.Cell = TableCell;

export default Table;
