'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _head = require('lodash/head');

var _head2 = _interopRequireDefault(_head);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _utils = require('../utils/');

var _keyCode = require('../constants/keyCode');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function inputContainer(Input) {
  var WrappedInput = function (_React$Component) {
    _inherits(WrappedInput, _React$Component);

    function WrappedInput() {
      var _ref;

      var _temp, _this, _ret;

      _classCallCheck(this, WrappedInput);

      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref = WrappedInput.__proto__ || Object.getPrototypeOf(WrappedInput)).call.apply(_ref, [this].concat(args))), _this), _this.state = {
        isFocused: false
      }, _this._handleBlur = function (e) {
        _this.props.onBlur(e);
        _this.setState({ isFocused: false });
      }, _this._handleChange = function (e) {
        var _this$props = _this.props,
            multiple = _this$props.multiple,
            onChange = _this$props.onChange,
            onRemove = _this$props.onRemove,
            selected = _this$props.selected;


        if (!multiple) {
          // Clear any selections when text is entered.
          !!selected.length && onRemove((0, _head2.default)(selected));
        }

        onChange(e);
      }, _this._handleFocus = function (e) {
        _this.props.onFocus(e);
        _this.setState({ isFocused: true });
      }, _this._handleKeyDown = function (e) {
        var _this$props2 = _this.props,
            activeItem = _this$props2.activeItem,
            initialItem = _this$props2.initialItem,
            multiple = _this$props2.multiple,
            onAdd = _this$props2.onAdd,
            onKeyDown = _this$props2.onKeyDown,
            selected = _this$props2.selected,
            selectHintOnEnter = _this$props2.selectHintOnEnter;


        var value = (0, _utils.getInputText)(_this.props);

        switch (e.keyCode) {
          case _keyCode.RETURN:
          case _keyCode.RIGHT:
          case _keyCode.TAB:
            var hintText = (0, _utils.getHintText)(_this.props);
            var selectionStart = e.target.selectionStart;

            // Autocomplete the selection if all of the following are true:

            if (
            // There's a hint or a menu item is highlighted.
            (hintText || activeItem) && (
            // There's no current selection, unless in multi-select mode.
            !selected.length || multiple) &&
            // The input cursor is at the end of the text string when the user
            // hits the right arrow key.
            !(e.keyCode === _keyCode.RIGHT && selectionStart !== value.length) && !(e.keyCode === _keyCode.RETURN && !selectHintOnEnter)) {
              e.preventDefault();

              var selectedOption = hintText ? initialItem : activeItem;

              onAdd && onAdd(selectedOption);
            }
            break;
        }

        onKeyDown(e);
      }, _temp), _possibleConstructorReturn(_this, _ret);
    }

    _createClass(WrappedInput, [{
      key: 'getChildContext',
      value: function getChildContext() {
        return {
          hintText: (0, _utils.getHintText)(this.props)
        };
      }
    }, {
      key: 'render',
      value: function render() {
        var _cx;

        var _props = this.props,
            activeIndex = _props.activeIndex,
            bsSize = _props.bsSize,
            disabled = _props.disabled,
            inputRef = _props.inputRef,
            isMenuShown = _props.isMenuShown,
            labelKey = _props.labelKey,
            menuId = _props.menuId,
            multiple = _props.multiple,
            onRemove = _props.onRemove,
            placeholder = _props.placeholder,
            renderToken = _props.renderToken,
            selected = _props.selected;

        // Add a11y-related props.

        var inputProps = _extends({}, this.props.inputProps, {
          'aria-activedescendant': activeIndex >= 0 ? (0, _utils.getMenuItemId)(activeIndex) : '',
          'aria-autocomplete': multiple ? 'list' : 'both',
          'aria-expanded': isMenuShown,
          'aria-haspopup': 'listbox',
          'aria-owns': menuId,
          autoComplete: 'off',
          disabled: disabled,
          inputRef: inputRef,
          onBlur: this._handleBlur,
          onChange: this._handleChange,
          // Re-open the menu, eg: if it's closed via ESC.
          onClick: this._handleFocus,
          onFocus: this._handleFocus,
          onKeyDown: this._handleKeyDown,
          placeholder: selected.length ? null : placeholder,
          // Comboboxes are single-select by definition:
          // https://www.w3.org/TR/wai-aria-practices-1.1/#combobox
          role: 'combobox',
          value: (0, _utils.getInputText)(this.props)
        });

        var className = inputProps.className || '';

        if (multiple) {
          inputProps = _extends({}, inputProps, {
            inputClassName: className,
            labelKey: labelKey,
            onRemove: onRemove,
            renderToken: renderToken,
            role: '',
            selected: selected
          });
        }

        return _react2.default.createElement(Input, _extends({}, inputProps, {
          className: (0, _classnames2.default)('rbt-input', (_cx = {}, _defineProperty(_cx, className, !multiple), _defineProperty(_cx, 'focus', this.state.isFocused), _defineProperty(_cx, 'input-lg form-control-lg', bsSize === 'large' || bsSize === 'lg'), _defineProperty(_cx, 'input-sm form-control-sm', bsSize === 'small' || bsSize === 'sm'), _cx))
        }));
      }
    }]);

    return WrappedInput;
  }(_react2.default.Component);

  WrappedInput.displayName = 'InputContainer(' + (0, _utils.getDisplayName)(Input) + ')';

  WrappedInput.childContextTypes = {
    hintText: _propTypes2.default.string.isRequired
  };

  return WrappedInput;
}

exports.default = inputContainer;