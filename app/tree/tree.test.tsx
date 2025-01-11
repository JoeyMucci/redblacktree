import { render as testingLibraryRender } from '@testing-library/react';
import { createTheme, MantineProvider, mergeThemeOverrides, Modal } from '@mantine/core';
import { theme } from '../../theme';
import { fireEvent, userEvent, screen } from '@/test-utils';
import Tree from './page';

interface Node {
  value: string
  isRed: boolean
}

const nil : Node = { value : 'Null', isRed : false };

// Groundwork to test the visual pop ups properly
const testTheme = mergeThemeOverrides(
  theme,
  createTheme({
    components: {
      Modal: Modal.extend({
        defaultProps: {
          transitionProps: { duration: 0 },
        },
      }),
    },
  })
);

async function render(ui: React.ReactNode) {
  return testingLibraryRender(<>{ui}</>, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <MantineProvider theme={testTheme}>{children}</MantineProvider>
    ),
  });
}

function switchExplanation() {
  const explanationToggle : HTMLElement = screen.getByLabelText('Explanation');
  fireEvent.click(explanationToggle);
}

function switchNulls() {
  const nullToggle : HTMLElement = screen.getByLabelText('Show Nulls');
  fireEvent.click(nullToggle);
}

function switchValues() {
  const valueToggle : HTMLElement = screen.getByLabelText('Show Values');
  fireEvent.click(valueToggle);
}

async function doOperationsVerbose(nums : number[]) {
  await doOperations(nums, true);
}

async function doOperationsQuiet(nums : number[]) {
  await doOperations(nums, false);
}

// Carries out the operations on the tree given by nums in sequence
// verbose controls alerts
// nums[i] > 0 => insert nums[i], nums[i] < 0 => delete nums[i]
async function doOperations(nums : number[], verbose : boolean) {
  async function insertOne(num : number) {
    const insertInput : HTMLElement = screen.getByTestId('insertInput');
    await userEvent.type(insertInput, String(num));
    const insertButton : HTMLElement = screen.getByText('Insert');
    fireEvent.click(insertButton);
  }

  async function deleteOne(num : number) {
    const deleteInput : HTMLElement = screen.getByTestId('deleteInput');
    await userEvent.type(deleteInput, String(num));
    const deleteButton : HTMLElement = screen.getByText('Delete');
    fireEvent.click(deleteButton);
  }

  switchExplanation();

  for(let i = 0; i < nums.length; i++) {
    if(i === nums.length - 1 && verbose) {
      switchExplanation();
    }

    if(nums[i] > 0) {
      await insertOne(nums[i]);
    }
    else {
      await deleteOne(-nums[i]);
    }
  }
}

// Returns whether the nodes displayed on the screen match nodes
// Nodes are supplied in the following manner...
// (root, level order of left subtree, level order of right subtree)
// to match how they render on screen
function doesScreenMatch(nodes : Node[]) : boolean {
  // Slicing at 3 because there are 3 non-node buttons (insert, delete, reset tree)
  const screenNodes : HTMLElement[] = screen.getAllByRole('button').slice(3);

  if(screenNodes.length !== nodes.length) {
    return false;
  }

  for(let i = 0; i < nodes.length; i++) {
    if(screenNodes[i].textContent !== nodes[i].value) {
      return false;
    }

    const screenNodeIsRed : boolean = screenNodes[i].style.getPropertyValue('--button-bg') !== 'black';

    if(screenNodeIsRed !== nodes[i].isRed) {
      return false;
    }
  }

  return true;
}

describe('Sliders', () => {
  it('Nulls Can Be Hidden', () => {
    render(<Tree />);

    // Null is there
    expect(screen.getByText('Null')).toBeInTheDocument();

    // Turn nulls off
    switchNulls();

    // Null is not there
    expect(() => screen.getByText('Null')).toThrow();
  })

  it('Values Can Be Hidden', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500]);

    // Value is there
    expect(screen.getByText(String(500))).toBeInTheDocument();

    // Turn values off
    switchValues();

    // Value is not there
    expect(() => screen.getByText(String(500))).toThrow();
  })

  it('Explanations Can Be Hidden', async () => {
    render(<Tree />);

    // Turn alerts off
    switchExplanation();

    await doOperationsVerbose([+500]);

    // There is no explanation for the insert
    expect(() => screen.getByText('Turn Root Black')).toThrow();
  })
})

describe('Insert Notifications', () => {
  it('Root Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500]);

    // Should receive explanation stating that the root needs to be turned black
    expect(screen.getByText('Turn Root Black')).toBeInTheDocument();
  });

  it('Black Parent Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750]);

    // Should receive explanation stating that the the add can go through w/o changes
    expect(screen.getByText('No Additional Action Required')).toBeInTheDocument();
  });

  it('Red Outside Notification (On the right)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, +875]);

    // Should receive explanation saying to do a left rotation
    expect(screen.getByText('Red Alert - Left Rotate and Swap Colors')).toBeInTheDocument();
  })

  it('Red Outside Notification (On the left)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +125]);

    // Should receive explanation saying to do a right rotation
    expect(screen.getByText('Red Alert - Right Rotate and Swap Colors'));
  })

  it('Red Inside Notification (Greater than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, +625]);

    // Should receive explanation saying to do a right rotation to setup the outside case
    expect(screen.getByText('Red Alert - Right Rotate Red Pair to Outside')).toBeInTheDocument();
  })

  it('Red Inside Notification (Less than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +375]);

    // Should receive explanation saying to do a right rotation to setup the outside case
    expect(screen.getByText('Red Alert - Left Rotate Red Pair to Outside')).toBeInTheDocument();
  })

  it('Red with Two Red Parents Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625]);

    // Should receive explanation saying to recolor the parents and grandparent and recheck
    expect(screen.getByText('Red Alert - Recolor and Move Up')).toBeInTheDocument();
  })
});

describe('Delete Notification', () => {
  it('Root Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, -500]);

    // Should receive explanation that deleting root does not cause problem and we can proceed
    expect(screen.getByText('No Additional Action Required')).toBeInTheDocument();
  })

  it('Red Leaf Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, -750]);

    // Should receive explanation that we can safely remove red node without futher problems
    expect(screen.getByText('Simply Remove the Red Node')).toBeInTheDocument();
  })

  it('Black with One Red Child Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +750, -500]);

    // Should receive explanation that we must replace the black node with its red child
    expect(screen.getByText('Replace Parent with Red Child Turned Black')).toBeInTheDocument();
  })

  it('Node with Two Children Notification', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, -500]);

    // Should receive explanation that we first need to find the in-order predecessor
    expect(screen.getByText('Replace Value with In-Order Predecessor to Get One Child')).toBeInTheDocument();
  })

  it('Node with a Red Sibling Notification (Right child)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +125, +375, +62, -750]);

    // Should receive explanation to right rotate to give node a black sibling instead
    expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
  })

  it('Node with a Red Sibling Notification (Left child)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625, +875, +562, -250]);

    // Should receive explanation to left rotate to give node a black sibling instead
    expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
  })

  it('Node with a Black Sibling with a Red Child on the Outside (Right side)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +875, -250]);

    // Should receive explantion to left rotate the sibling up
    expect(screen.getByText('Lack of Black - Left Rotate and Color New Children Black')).toBeInTheDocument();
  })

  it('Node with a Black Sibling with a Red Child on the Outside (Left side)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +125, -750]);

    // Should receive explantion to right rotate the sibling up
    expect(screen.getByText('Lack of Black - Right Rotate and Color New Children Black')).toBeInTheDocument();
  })
  
  it('Node with a Black Sibling with a Red Child on the Inside (Greater than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625, -250]);

    // Should receive notification that we need to right rotate to reduce to outside case
    expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
  })

  it('Node with a Black Sibling with a Red Child on the Inside (Less than root)', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +375, -750]);

    // Should receive notification that we need to left rotate to reduce to outside case
    expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
  })

  it('Node with a Red Parent and Black Sibling with no Red Child', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +625, +875, +937, -937, -875]);

    // Should receive notification that we need color sibling red and parent black
    expect(screen.getByText('Lack of Black - Swap Colors of Parent and Sibling')).toBeInTheDocument();
  })

  it('Node with a Black Parent and Black Sibling with no Red Child', async () => {
    render(<Tree />);

    await doOperationsVerbose([+500, +250, +750, +875, -875, -750]);

    // Should receive notification that we need color sibling red move the issue upwards
    expect(screen.getByText('Lack of Black - Color Sibling Red and Move Up')).toBeInTheDocument();
  })
})

describe('Insert Tree Makeup', () => {
  it('Root', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500]);

    const expectedNodes : Node[] = [
      { value : '500', isRed : false },
      nil,
      nil,
    ];

    expect(doesScreenMatch(expectedNodes)).toBeTruthy();
  })

  it('Black Parent', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750]);

    const expectedNodes : Node[] = [
      { value : '500', isRed : false },
      nil,
      { value : '750', isRed : true },
      nil,
      nil,
    ];

    expect(doesScreenMatch(expectedNodes)).toBeTruthy();
  });

  it('Red Outside (On the right)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750, +875]);

    const expectedNodes : Node[] = [
      { value : '750', isRed : false },
      { value : '500', isRed : true },
      nil, 
      nil, 
      { value : '875', isRed : true },
      nil, 
      nil,
    ];

    expect(doesScreenMatch(expectedNodes)).toBeTruthy();
  })

  it('Red Outside (On the left)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +125]);

    const expectedNodes : Node[] = [
      { value : '250', isRed : false},
      { value : '125', isRed : true},
      nil, 
      nil, 
      { value : '500', isRed : true},
      nil, 
      nil,
    ];

    expect(doesScreenMatch(expectedNodes)).toBeTruthy();
  })

  it('Red Inside (Greater than root)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +750, +625]);

    const expectedNodes : Node[] = [
      { value : '625', isRed : false},
      { value : '500', isRed : true},
      nil, 
      nil, 
      { value : '750', isRed : true},
      nil, 
      nil,
    ];

    expect(doesScreenMatch(expectedNodes)).toBeTruthy();
  })

  it('Red Inside (Less than root)', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +375]);

    const expectedNodes : Node[] = [
      { value : '375', isRed : false},
      { value : '250', isRed : true},
      nil, 
      nil, 
      { value : '500', isRed : true},
      nil, 
      nil,
    ];

    expect(doesScreenMatch(expectedNodes)).toBeTruthy();
  })

  it('Red with Two Red Parents', async () => {
    render(<Tree />);

    await doOperationsQuiet([+500, +250, +750, +625]);

    const expectedNodes : Node[] = [
      { value : '500', isRed : false},
      { value : '250', isRed : false},
      nil, 
      nil, 
      { value : '750', isRed : false},
      { value : '625', isRed : true},
      nil, 
      nil, 
      nil,
    ];

    expect(doesScreenMatch(expectedNodes)).toBeTruthy();
  })
});

// describe('Delete Tree Makeup', () => {
//   it('Root Notification', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, -500]);

//     // Should receive explanation that deleting root does not cause problem and we can proceed
//     expect(screen.getByText('No Additional Action Required')).toBeInTheDocument();
//   })

//   it('Red Leaf Notification', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +750, -750]);

//     // Should receive explanation that we can safely remove red node without futher problems
//     expect(screen.getByText('Simply Remove the Red Node')).toBeInTheDocument();
//   })

//   it('Black with One Red Child Notification', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +750, -500]);

//     // Should receive explanation that we must replace the black node with its red child
//     expect(screen.getByText('Replace Parent with Red Child Turned Black')).toBeInTheDocument();
//   })

//   it('Node with Two Children Notification', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, -500]);

//     // Should receive explanation that we first need to find the in-order predecessor
//     expect(screen.getByText('Replace Value with In-Order Predecessor to Get One Child')).toBeInTheDocument();
//   })

//   it('Node with a Red Sibling Notification (Right child)', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +125, +375, +62, -750]);

//     // Should receive explanation to right rotate to give node a black sibling instead
//     expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
//   })

//   it('Node with a Red Sibling Notification (Left child)', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +625, +875, +562, -250]);

//     // Should receive explanation to left rotate to give node a black sibling instead
//     expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Black Sibling')).toBeInTheDocument();
//   })

//   it('Node with a Black Sibling with a Red Child on the Outside (Right side)', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +875, -250]);

//     // Should receive explantion to left rotate the sibling up
//     expect(screen.getByText('Lack of Black - Left Rotate and Color New Children Black')).toBeInTheDocument();
//   })

//   it('Node with a Black Sibling with a Red Child on the Outside (Left side)', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +125, -750]);

//     // Should receive explantion to right rotate the sibling up
//     expect(screen.getByText('Lack of Black - Right Rotate and Color New Children Black')).toBeInTheDocument();
//   })
  
//   it('Node with a Black Sibling with a Red Child on the Inside (Greater than root)', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +625, -250]);

//     // Should receive notification that we need to right rotate to reduce to outside case
//     expect(screen.getByText('Lack of Black - Right Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
//   })

//   it('Node with a Black Sibling with a Red Child on the Inside (Less than root)', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +375, -750]);

//     // Should receive notification that we need to left rotate to reduce to outside case
//     expect(screen.getByText('Lack of Black - Left Rotate and Swap Colors to Get Outside Red')).toBeInTheDocument();
//   })

//   it('Node with a Red Parent and Black Sibling with no Red Child', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +625, +875, +937, -937, -875]);

//     // Should receive notification that we need color sibling red and parent black
//     expect(screen.getByText('Lack of Black - Swap Colors of Parent and Sibling')).toBeInTheDocument();
//   })

//   it('Node with a Black Parent and Black Sibling with no Red Child', async () => {
//     render(<Tree />);

//     await doOperationsQuiet([+500, +250, +750, +875, -875, -750]);

//     // Should receive notification that we need color sibling red move the issue upwards
//     expect(screen.getByText('Lack of Black - Color Sibling Red and Move Up')).toBeInTheDocument();
//   })
// })