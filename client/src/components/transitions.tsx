import React, { ReactElement } from 'react';
import { CSSTransition } from 'react-transition-group';//install types
interface transitionProps {
  duration: any
  children: any
}
type trans= ReactElement<any, any> | null
const Appear: React.FC<transitionProps>  = ({ duration, children }): trans => (
	<CSSTransition
		in
		classNames='Appear'
		timeout={duration || 1000}
		appear
	>
		{children}
	</CSSTransition>
);

export { Appear };
