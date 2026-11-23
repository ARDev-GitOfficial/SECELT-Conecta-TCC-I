export function Button({ children, kind = 'blue', ...props }) {
  return <button className={'button ' + kind} {...props}>{children}</button>;
}
