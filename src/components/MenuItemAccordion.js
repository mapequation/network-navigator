import React, { useState } from "react";
import { Accordion, Icon, Menu, Popup } from "semantic-ui-react";


export default function MenuItemAccordion(props) {
  const { title, popup, children } = props;
  const [visible, setVisible] = useState(props.visible || false);

  const accordionTitle = <Accordion.Title active={visible} onClick={() => setVisible(!visible)}>
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
