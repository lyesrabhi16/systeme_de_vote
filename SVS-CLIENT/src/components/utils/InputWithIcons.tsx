import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { cn } from '@/lib/utils';
import React from 'react';

const InputWithIcons = (props: {
  LeftIcon: React.ElementType;
  input_props?: React.ComponentProps<typeof InputGroupInput>;
  icon_props?: React.ComponentProps<'svg'>;
}) => {
  return (
    <InputGroup>
      <InputGroupAddon>
        <props.LeftIcon
          {...props.icon_props}
          className={cn(
            'w-4 h-4 text-muted-foreground',
            props.icon_props?.className,
          )}
        />
      </InputGroupAddon>
      <InputGroupInput {...props.input_props} />
    </InputGroup>
  );
};

export default InputWithIcons;
