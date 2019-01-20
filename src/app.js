/* global window, fetch */
import React, {Component} from 'react';
import {render} from 'react-dom';
import MapGL from 'react-map-gl';
import ControlPanel from './control-panel';

import {defaultMapStyle, dataLayer} from './map-style.js';
import {store} from './store';
import {fromJS} from 'immutable';
import {json as requestJson} from 'd3-request';

const MAPBOX_TOKEN = 'pk.eyJ1IjoieGJyaW4iLCJhIjoiY2lzMjkycXRwMDAwNjJ5bzl1cmFndHFkNSJ9.BYUfG_vj3nRFLIJNq5Y2Ig';

export default class App extends Component {

  state = {
    mapStyle: defaultMapStyle,
    data: null,
    hoveredFeature: null,
    viewport: {
      latitude: -27.882735018715028,
      longitude: 153.3943262050711,
      zoom: 14,
      bearing: 0,
      pitch: 0
    }
  };

  constructor(args) {
    super(args)
    this.mapRef = React.createRef();    
    store.subscribe(() => {
      if(this.state.data) {
        const {
          activeConstructionMaterialFilter,
          activeSizeCategoryFilter,
          features
        } = store.getState()
        let filteredRamps = Array.from(features)
        if(activeConstructionMaterialFilter) {
          filteredRamps = filteredRamps.filter(feature => {
            return feature.properties.material == activeConstructionMaterialFilter
          })
        }
        if(activeSizeCategoryFilter) {
          filteredRamps = filteredRamps.filter(feature => {
            return this.getSizeCategoryName(feature.properties.area_) == activeSizeCategoryFilter
          })
        }
        const data = {
          type: 'FeatureCollection',
          features: filteredRamps,
          totalFeatures: filteredRamps.length
        }
        const mapStyle = defaultMapStyle
          // Add geojson source to map
          .setIn(['sources', 'boatRamps'], fromJS({type: 'geojson', data}))
          // Add point layer to map
          .set('layers', defaultMapStyle.get('layers').push(dataLayer));
    
        this.setState({data, mapStyle});
      }
    })
  }

  componentDidMount() {
    requestJson('data/boat_ramps.geojson', (error, response) => {
      if (!error) {
        this._loadData(response);
      }
    });
  }

  _loadData = data => {
    const mapStyle = defaultMapStyle
      // Add geojson source to map
      .setIn(['sources', 'boatRamps'], fromJS({type: 'geojson', data}))
      // Add point layer to map
      .set('layers', defaultMapStyle.get('layers').push(dataLayer));

    const {_sw: sw, _ne: ne} = this.mapRef.current.getMap().getBounds()
    store.dispatch({ type: 'BOAT_RAMPS_LOADED', data, sw, ne })

    this.setState({data, mapStyle});
  };

  _onViewportChange = viewport => {
    this.setState({viewport});
    if(this.mapRef.current) {
      const {_sw: sw, _ne: ne} = this.mapRef.current.getMap().getBounds()
      store.dispatch({ type: 'MAP_VIEWPORT_CHANGED', sw, ne })
    }
  }

  _onHover = event => {
    const {features, srcEvent: {offsetX, offsetY}} = event;
    const hoveredFeature = features && features.find(f => f.layer.id === 'data');

    this.setState({hoveredFeature, x: offsetX, y: offsetY});
  };

  getSizeCategoryName = area => {
    return  area < 50 ? 'Small' :
            area < 200 ? 'Medium' :
            'Large';
  }

  _renderTooltip() {
    const {hoveredFeature, x, y} = this.state;
    return hoveredFeature && (
      <div className="tooltip" style={{left: x, top: y}}>
        <div>Material: {hoveredFeature.properties.material}</div>
        <div>Size Category: {
          this.getSizeCategoryName(hoveredFeature.properties.area_)
        }</div>
      </div>
    );
  }

  render() {

    const {viewport, mapStyle} = this.state;

    return (
      <div style={{height: '100%'}}>
        <MapGL
          ref={this.mapRef}
          {...viewport}
          width="100%"
          height="100%"
          mapStyle={mapStyle}
          onViewportChange={this._onViewportChange}
          mapboxApiAccessToken={MAPBOX_TOKEN}
          onHover={this._onHover} >

          {this._renderTooltip()}

        </MapGL>

        <ControlPanel
          containerComponent={this.props.containerComponent}
          settings={this.state}
          onChange={this._updateSettings}
        />
      </div>
    );
  }

}

export function renderToDom(container) {
  render(<App/>, container);
}
