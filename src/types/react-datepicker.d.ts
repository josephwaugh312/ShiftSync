declare module 'react-datepicker' {
  import { ReactElement, ComponentProps } from 'react';
  
  export interface ReactDatePickerProps {
    selected?: Date | null;
    onChange?: (date: Date, event?: React.SyntheticEvent<any>) => void;
    inline?: boolean;
    highlightDates?: Date[];
    className?: string;
    [key: string]: any;
  }
  
  declare const DatePicker: React.FC<ReactDatePickerProps>;
  export default DatePicker;
}

declare module 'react-datepicker/dist/react-datepicker.css'; 