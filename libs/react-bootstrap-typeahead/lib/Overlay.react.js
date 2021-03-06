'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _componentOrElement = require('prop-types-extra/lib/componentOrElement');

var _componentOrElement2 = _interopRequireDefault(_componentOrElement);

var _Portal = require('react-overlays/lib/Portal');

var _Portal2 = _interopRequireDefault(_Portal);

var _Popper = require('react-popper/lib/Popper');

var _Popper2 = _interopRequireDefault(_Popper);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var BODY_CLASS = 'rbt-body-container';

// When appending the overlay to `document.body`, clicking on it will register
// as an "outside" click and immediately close the overlay. This classname tells
// `react-onclickoutside` to ignore the click.
var IGNORE_CLICK_OUTSIDE = 'ignore-react-onclickoutside';

function getModifiers(_ref) {
  var align = _ref.align,
      flip = _ref.flip;

  return {
    computeStyles: {
      enabled: true,
      fn: function fn(data) {
        // Use the following condition instead of `align === 'justify'` since
        // it allows the component to fall back to justifying the menu width
        // even when `align` is undefined.
        if (align !== 'right' && align !== 'left') {
          // Set the popper width to match the target width.
          data.styles.width = data.offsets.reference.width;
        }
        return data;
      }
    },
    flip: {
      enabled: flip
    },
    preventOverflow: {
      escapeWithReference: true
    }
  };
}

function isBody(container) {
  return container === document.body;
}

/**
 * Custom `Overlay` component, since the version in `react-overlays` doesn't
 * work for our needs. Specifically, the `Position` component doesn't provide
 * the customized placement we need.
 */

var Overlay = function (_React$Component) {
  _inherits(Overlay, _React$Component);

  function Overlay() {
    var _ref2;

    var _temp, _this, _ret;

    _classCallCheck(this, Overlay);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = _possibleConstructorReturn(this, (_ref2 = Overlay.__proto__ || Object.getPrototypeOf(Overlay)).call.apply(_ref2, [this].concat(args))), _this), _this._update = function () {
      var _container$classList;

      var _this$props = _this.props,
          className = _this$props.className,
          container = _this$props.container,
          show = _this$props.show;

      // Positioning is only used when body is the container.

      if (!(show && isBody(container))) {
        return;
      }

      // Set a classname on the body for scoping purposes.
      container.classList.add(BODY_CLASS);
      !!className && (_container$classList = container.classList).add.apply(_container$classList, _toConsumableArray(className.split(' ')));
    }, _temp), _possibleConstructorReturn(_this, _ret);
  }

  _createClass(Overlay, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this._update();
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      var onMenuHide = nextProps.onMenuHide,
          onMenuShow = nextProps.onMenuShow,
          show = nextProps.show;


      if (this.props.show && !show) {
        onMenuHide();
      }

      if (!this.props.show && show) {
        onMenuShow();
      }

      // Remove scoping classes if menu isn't being appended to document body.
      var _props = this.props,
          className = _props.className,
          container = _props.container;

      if (isBody(container) && !isBody(nextProps.container)) {
        var _container$classList2;

        container.classList.remove(BODY_CLASS);
        !!className && (_container$classList2 = container.classList).remove.apply(_container$classList2, _toConsumableArray(className.split(' ')));
      }

      this._update();
    }
  }, {
    key: 'render',
    value: function render() {
      var _props2 = this.props,
          align = _props2.align,
          children = _props2.children,
          container = _props2.container,
          dropup = _props2.dropup,
          show = _props2.show,
          target = _props2.target;


      if (!(show && _react.Children.count(children) && target)) {
        return null;
      }

      var child = _react.Children.only(children);

      var xPlacement = align === 'right' ? 'end' : 'start';
      var yPlacement = dropup ? 'top' : 'bottom';

      return _react2.default.createElement(
        _Portal2.default,
        { container: container },
        _react2.default.createElement(
          _Popper2.default,
          {
            modifiers: getModifiers(this.props),
            placement: yPlacement + '-' + xPlacement,
            target: target },
          function (props) {
            var _props$popperProps = props.popperProps,
                ref = _props$popperProps.ref,
                popperProps = _objectWithoutProperties(_props$popperProps, ['ref']);

            return (0, _react.cloneElement)(child, _extends({}, child.props, popperProps, {
              className: (0, _classnames2.default)(child.props.className, _defineProperty({}, IGNORE_CLICK_OUTSIDE, isBody(container))),
              innerRef: ref
            }));
          }
        )
      );
    }
  }]);

  return Overlay;
}(_react2.default.Component);

Overlay.propTypes = {
  children: _propTypes2.default.element,
  container: _componentOrElement2.default.isRequired,
  onMenuHide: _propTypes2.default.func.isRequired,
  onMenuShow: _propTypes2.default.func.isRequired,
  show: _propTypes2.default.bool,
  target: _componentOrElement2.default
};

Overlay.defaultProps = {
  show: false
};

exports.default = Overlay;