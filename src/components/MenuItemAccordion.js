import React, { useState } from "react";
import { Accordion, Icon, Menu, Popup } from "semantic-ui-react";


export default function MenuItemAccordion(props) {
  const { title, popup, children } = props;
  const [active, setActive] = useState(props.active || false);

  const accordionTitle = <Accordion.Title active={active} onClick={() => setActive(!active)}>
    <Icon name='dropdown'/>{title}
  </Accordion.Title>;

  return (
    <Menu.Item as={Accordion}>
      {popup ? <Popup trigger={accordionTitle} content={popup} size='tiny'/> : accordionTitle}
      <Accordion.Content active={active} children={children}/>
    </Menu.Item>
  );
}
