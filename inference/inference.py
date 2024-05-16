import torch
from inference import MODEL_DICT

class Inferencer:
    def __init__(self, model_name: str, model_config: dict):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        # self.model = MODEL_DICT[model_name]['instance'].to(self.device)
        self.model = MODEL_DICT[model_name]['instance'](**model_config).to(self.device)
        model_weights = MODEL_DICT[model_name]['weights'] if 'weights' in MODEL_DICT[model_name] else None
        if model_weights is not None:
            self.model.load_state_dict(torch.load(model_weights))
        self.forward = MODEL_DICT[model_name]['forward']

    def inference(self, coordinates):
        def normalize(coordinates):
            if coordinates.max() > 1 or coordinates.min() < 0:
                coordinates = (coordinates - coordinates.min()) / (coordinates.max() - coordinates.min())
            return coordinates
        self.model.eval()
        with torch.no_grad():
            coordinates = torch.Tensor(coordinates).to(self.device)
            coordinates = normalize(coordinates)
            output = self.forward(self.model, coordinates[None])
            return output.cpu().numpy()[0]
    
    
        
        