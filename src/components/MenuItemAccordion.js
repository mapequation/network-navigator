import React from "react";
import { Accordion, Icon, Menu, Popup } from "semantic-ui-react";


export default class MenuItemAccordion extends React.PureComponent {
  state = {
    visible: this.props.visible || false
  };

  toggle = () => this.setState({ visible: !this.state.visible });

  render() {
    const { visible } = this.state;
    const { title, popup, children } = this.props;

    const accordionTitle = <Accordion.Title active={visible} onClick={this.toggle}>
      <Icon name='dropdown'/>{title}
    </Accordion.Title>;

    return (
      <Menu.Item as={Accordion}>
        {popup ? <Popup trigger={accordionTitle} content={popup} size='tiny'/> : accordionTitle}
        <Accordion.Content active={visible}>
          {children}
        </Accordion.Content>
      </Menu.Item>
    );
  }
}
