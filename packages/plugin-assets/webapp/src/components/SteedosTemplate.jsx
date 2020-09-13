import React, { Component } from 'react';
import ReactDOM from 'react-dom';

class SteedosTemplate extends Component {

  constructor(props, context) {
    super(props, context);
    this.Blaze = window.Blaze;
    this.Template = window.Template;
    this.ReactiveVar = window.ReactiveVar;
  }

  componentDidMount() {
    this.renderBlazeView();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.name != this.props.name) {
      this.Blaze.remove(this._blazeView);
      this.renderBlazeView();
    }
  }

  renderBlazeView() {
    this._blazeData = new this.ReactiveVar(_.omit(this.props, 'name'));

    let name, tArg = this.props.name;
    if (typeof tArg === 'string') {
      name = this.Template[tArg];
      if (!name)
        throw new Error(`No Template["${tArg}"] exists.  If this name `
          + "originates in your app, make sure you have the `templating` "
          + "package installed (and not, for e.g. `static-html`)");
    } else if (tArg instanceof this.Blaze.Template) {
      name = tArg;
    } else {
        throw new Error("Invalid name= argument specified.  Expected "
          + "the string name of an existing Template, or the name "
          + "itself, instead got ''" + typeof tArg + ": "
          + JSON.stringify(tArg));
    }

    this._blazeView = this.Blaze.renderWithData(
      name,
      () => this._blazeData.get(),
      ReactDOM.findDOMNode(this._blazeRef)
    );
  }

  shouldComponentUpdate(nextProps) {
    // this used to be in (the now deprecated) componentWillReceiveProps
    this._blazeData.set(_.omit(nextProps, 'name'));

    // Never call render() for props except name again; Blaze will do what's necessary.
    return nextProps.name !== this.props.name;
  }

  componentWillUnmount() {
    this.Blaze.remove(this._blazeView);
  }

  render() {
    return ( <span className={this.props.className || ''} ref={(c) => this._blazeRef = c} /> );
  }

}

export default SteedosTemplate;