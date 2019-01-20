import React, {PureComponent} from 'react';
import {store} from './store'

const defaultContainer =  ({children}) => <div className="control-panel">{children}</div>;

export default class ControlPanel extends PureComponent {

  render() {
    const Container = this.props.containerComponent || defaultContainer;

    return (
      <Container>
      <h3>Construction Materials</h3>
      <ul>{
        store.getState().rampsCountPerConstructionMaterial.map(({name, ramps}) => 
          <li key={name}>
            <a href="#" style={{
              color: store.getState().activeConstructionMaterialFilter == name ? 'red' : 'blue'
            }} onClick={() => {
              store.dispatch({type: 'CONSTRUCTION_MATERIAL_FILTER_CHANGED', name})
            }}>{name}</a>: {
              ramps.filter(ramp => ramp.properties.visible).length
            }
          </li>
        )
      }</ul>
      <hr />
      <h3>Size Categories</h3>
      <ul>{
        store.getState().rampsCountPerSizeCategory.map(({name, ramps}) => 
          <li key={name}>
            <a href="#" style={{
              color: store.getState().activeSizeCategoryFilter == name ? 'red' : 'blue'
            }} href="#" onClick={() => {
              store.dispatch({type: 'SIZE_CATEGORY_FILTER_CHANGED', name})
            }}>{name}</a>: {
              ramps.filter(ramp => ramp.properties.visible).length
            }
          </li>
        )
      }</ul>
      </Container>
    );
  }
}
