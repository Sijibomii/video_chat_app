import React, { useEffect, ReactElement, useState } from 'react';
//import PropTypes from 'prop-types';
import { RIEInput } from 'riek'

interface inputProps {
  value: String
  propName: String
  className:String
  classLoading:any
  classInvalid:any
  editProps:any
  onChange:any
}
const EditableInput: React.FC<inputProps>  = ({
  value,
  propName,
  className,
  classLoading,
  classInvalid,
  editProps,
  onChange
}):ReactElement<any, any> | null =>{
  const [state, setState]= useState(0)
  useEffect(() => {
    setState(state + 1);//doing this so the component can re-render. It's probably bullshit I know
    
  }, [ value,
    propName,
    className,
    classLoading,
    classInvalid,
    editProps,])
	return (
    <RIEInput
				value={value}
				propName={propName}
				className={className}
				classLoading={classLoading}
				classInvalid={classInvalid}
				shouldBlockWhileLoading
				editProps={editProps}
				change={(data:any) => onChange(data)}
			/>
  )}

  export default EditableInput;