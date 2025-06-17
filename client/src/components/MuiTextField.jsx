import { memo } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";

/**
 * MuiTextField
 *
 * @param {string} name - field name in the form
 * @param {object} control - react-hook-form control object
 * @param {object} [rules] - validation rules for the field
 * @param {string} [type='text'] - input type
 * @param {string} [formLabel] - external label text rendered above the input
 * @param {object} [formControlProps] - props spread to MUI FormControl. Common options:
 *   - margin: 'none' | 'dense' | 'normal' // vertical spacing
 *   - required: bool                // flags the field as required
 *   - disabled: bool                // disable child inputs
 *   - error: bool                   // marks the control as error
 *   - fullWidth: bool               // stretches to 100% width
 *   - sx: object                    // MUI styling overrides
 *   - variant: 'standard' | 'outlined' | 'filled' // FormControl variant
 *   - component: elementType        // root component override
 *   - color: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'
 *   - dir: 'ltr' | 'rtl'           // text direction
 *
 * @param {object} [formLabelProps] - props spread to MUI FormLabel. Common options:
 *   - component: elementType       // wrapper element (e.g. 'label')
 *   - htmlFor: string              // links label to input id
 *   - required: bool               // displays asterisk
 *   - error: bool                  // applies error color
 *   - focused: bool                // apply focused state styles
 *   - disabled: bool               // applies disabled styles
 *   - filled: bool                 // filled state styles
 *   - color: 'primary' | 'secondary' | 'error' | ... // label color
 *   - sx: object                   // MUI styling overrides
 *   - classes: object              // override CSS classes
 *   - asterisk: node               // custom asterisk element
 *
 * @param {object} [props] - any other TextField props (e.g. placeholder, helperTextOverride)
 */
const MuiTextField = memo(
  ({
    name,
    control,
    rules,
    type = "text",
    formLabel,
    formControlProps = {},
    formLabelProps = {},
    ...props
  }) => (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormControl fullWidth error={!!error} {...formControlProps}>
          {formLabel && (
            <FormLabel {...formLabelProps} htmlFor={name}>
              {formLabel}
            </FormLabel>
          )}
          <TextField
            {...field}
            id={name}
            type={type}
            size="small"
            variant="outlined"
            fullWidth
            required={!!rules?.required}
            error={!!error}
            helperText={error?.message}
            {...props}
          />
        </FormControl>
      )}
    />
  )
);

MuiTextField.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  type: PropTypes.string,
  formLabel: PropTypes.string,
  formControlProps: PropTypes.object,
  formLabelProps: PropTypes.object,
};

export default MuiTextField;
