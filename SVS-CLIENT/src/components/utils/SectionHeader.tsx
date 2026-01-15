const SectionHeader = ({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) => (
  <div className='flex items-center gap-2 mb-4 pb-2 border-b'>
    <Icon className='w-5 h-5 text-muted-foreground' />
    <h3 className='text-sm font-semibold text-foreground'>{title}</h3>
  </div>
);

export default SectionHeader;
