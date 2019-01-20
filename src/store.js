import { createStore } from 'redux'

function boatRampsStore(
  state = {
    features: [],
    rampsCountPerConstructionMaterial: [],
    rampsCountPerSizeCategory: [
      { name: 'Small', ramps: [] },
      { name: 'Medium', ramps: [] },
      { name: 'Large', ramps: [] }
    ],
    activeConstructionMaterialFilter: null,
    activeSizeCategoryFilter: null
  },
  action
) {
  const {features} = action.data || state;
  switch (action.type) {
    case 'BOAT_RAMPS_LOADED':
      features.forEach(f => {
        // Grouping ramps per construction material
        const { material } = f.properties
        const constructionMaterialGroup =
          state.rampsCountPerConstructionMaterial.find(el => el.name == material);
        if(constructionMaterialGroup) {
          constructionMaterialGroup.ramps.push(f);
        } else {
          state.rampsCountPerConstructionMaterial.push({
            name: material,
            ramps: [f]
          });
        }

        // Grouping ramps per size category        
        const { area_: area } = f.properties
        const sizeCategory =
          area < 50 ? 'Small' :
          area < 200 ? 'Medium' :
          'Large';
        state.rampsCountPerSizeCategory
          .find(el => el.name == sizeCategory)
          .ramps.push(f);

        // Computing ramps center
        const coordinates = f.geometry.coordinates[0][0];
        const coordinatesSums = coordinates.reduce(
          (sum, coordinate) => ([ sum[0] + coordinate[0], sum[1] + coordinate[1] ]),
          [0.0, 0.0]
        );
        f.properties.center = [
          coordinatesSums[0] / coordinates.length,
          coordinatesSums[1] / coordinates.length
        ];

        // Mark as unvisible until MAP_VIEWPORT_CHANGED is fired
        f.properties.visible = false;
      });
      state.features = features
      // BOAT_RAMPS_LOADED also executes MAP_VIEWPORT_CHANGED
    case 'MAP_VIEWPORT_CHANGED':
      features.forEach(f => {
        const [lng, lat] = f.properties.center
        f.properties.visible = 
          lat > action.sw.lat &&
          lat < action.ne.lat && 
          lng > action.sw.lng && 
          lng < action.ne.lng;
      })
      return state
    
    case 'CONSTRUCTION_MATERIAL_FILTER_CHANGED':
      if(state.activeConstructionMaterialFilter == action.name) {
        state.activeConstructionMaterialFilter = null;
      } else {
        state.activeConstructionMaterialFilter = action.name;
      }
      return state

    case 'SIZE_CATEGORY_FILTER_CHANGED':
      if(state.activeSizeCategoryFilter == action.name) {
        state.activeSizeCategoryFilter = null;
      } else {
        state.activeSizeCategoryFilter = action.name;
      }
      return state

    default:
      return state
  }
}

let store = createStore(boatRampsStore)

export {store}