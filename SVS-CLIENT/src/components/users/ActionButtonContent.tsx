import { type ReactElement, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/spinner';

const ActionButtonContent = (props: {
  loadingState: boolean;
  icon: ReactElement;
  children: ReactNode;
}) => {
  return (
    <>
      {props.loadingState ? <Spinner /> : props.icon}
      {props.children}
    </>
  );
};

export default ActionButtonContent;
